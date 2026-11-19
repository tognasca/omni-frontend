import { useEffect, useRef, useState } from 'react'
import { api } from '@/services/api'

type Configuration = { appId: string; configId: string; graphVersion: string }
type Assets = { waba_id: string; phone_number_id: string }
type MetaSdk = {
  init(options: { appId: string; version: string }): void
  login(callback: (result: { authResponse?: { code?: string } }) => void, options: {
    config_id: string
    response_type: 'code'
    override_default_response_type: true
    extras: { setup: Record<string, never> }
  }): void
}

const sdkWindow = window as Window & { FB?: MetaSdk }
let sdkLoad: Promise<MetaSdk> | undefined

function loadSdk(): Promise<MetaSdk> {
  if (sdkWindow.FB) return Promise.resolve(sdkWindow.FB)
  if (sdkLoad) return sdkLoad
  sdkLoad = new Promise<MetaSdk>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://connect.facebook.net/pt_BR/sdk.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onload = () => sdkWindow.FB ? resolve(sdkWindow.FB) : reject(new Error('SDK indisponível'))
    script.onerror = () => reject(new Error('Falha ao carregar SDK'))
    document.head.appendChild(script)
  }).catch(error => {
    sdkLoad = undefined
    throw error
  })
  return sdkLoad
}

type SignupAttempt = { code?: string; assets?: Assets; timer: number }

const endpoint = '/whatsapp/signup-preview'

export function WhatsAppSignupPreview() {
  const [configuration, setConfiguration] = useState<Configuration>()
  const [sdk, setSdk] = useState<MetaSdk>()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const attempt = useRef<SignupAttempt | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    api.get<Configuration>(endpoint, { signal: controller.signal })
      .then(async ({ data }) => {
        if (controller.signal.aborted) return
        setConfiguration(data)
        const loaded = await loadSdk()
        if (controller.signal.aborted) return
        loaded.init({ appId: data.appId, version: data.graphVersion })
        setSdk(loaded)
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setMessage('Não foi possível preparar o teste da Meta.')
      })
    return () => controller.abort()
  }, [])

  function finish(message: string) {
    if (attempt.current) window.clearTimeout(attempt.current.timer)
    attempt.current = null
    setBusy(false)
    setMessage(message)
  }

  function validate() {
    const current = attempt.current
    if (!current?.code || !current.assets) return
    window.clearTimeout(current.timer)
    attempt.current = null
    void api.post<{ status: string }>(endpoint, {
      code: current.code,
      wabaId: current.assets.waba_id,
      phoneNumberId: current.assets.phone_number_id,
    }).then(({ data }) => {
      finish(data.status === 'sandbox_verified' ? 'Sandbox validado pela Meta.' : 'A Meta não confirmou o sandbox.')
    }).catch(() => finish('A validação falhou. Confira o sandbox configurado e tente novamente.'))
  }

  useEffect(() => {
    function receive(event: MessageEvent<unknown>) {
      if (!attempt.current || !['https://www.facebook.com', 'https://web.facebook.com', 'https://facebook.com'].includes(event.origin)) return
      if (typeof event.data !== 'string') return
      let payload: { type?: string; event?: string; data?: Partial<Assets> } | null
      try { payload = JSON.parse(event.data) } catch { return }
      if (payload?.type !== 'WA_EMBEDDED_SIGNUP') return
      if (payload.event === 'CANCEL' || payload.event === 'ERROR') {
        finish(payload.event === 'CANCEL' ? 'Cadastro cancelado.' : 'A Meta interrompeu o cadastro.')
        return
      }
      const { waba_id, phone_number_id } = payload.data ?? {}
      if (payload.event === 'FINISH' && typeof waba_id === 'string' && typeof phone_number_id === 'string') {
        attempt.current.assets = { waba_id, phone_number_id }
        validate()
      }
    }
    window.addEventListener('message', receive)
    return () => {
      window.removeEventListener('message', receive)
      if (attempt.current) window.clearTimeout(attempt.current.timer)
      attempt.current = null
    }
  }, [])

  function launch() {
    if (!configuration || !sdk || busy || attempt.current) return
    setBusy(true)
    setMessage('')
    const current: SignupAttempt = { timer: window.setTimeout(() => finish('Onboarding expirado. Abra o teste novamente.'), 600_000) }
    attempt.current = current
    try {
      sdk.login(result => {
        if (attempt.current !== current) return
        const code = result.authResponse?.code
        if (!code) {
          finish('A autorização não foi concluída. Use Finalizar na janela da Meta.')
          return
        }
        current.code = code
        validate()
      }, { config_id: configuration.configId, response_type: 'code', override_default_response_type: true, extras: { setup: {} } })
    } catch {
      finish('Não foi possível abrir a janela da Meta.')
    }
  }

  if (!configuration) return null
  return (
    <section className="border-b border-white/10 px-4 py-3" aria-label="Homologação do WhatsApp">
      <button type="button" className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50"
        disabled={!sdk || busy} onClick={launch}>
        {busy ? 'Aguardando Meta…' : 'Testar conexão com a Meta'}
      </button>
      <p className="mt-2 text-sm" role="status">{message || 'Homologação com a conta sandbox.'}</p>
    </section>
  )
}
