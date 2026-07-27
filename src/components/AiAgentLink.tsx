import { Icon } from './Icon'
import { aiAgent } from '../data/profile'

type Variant = 'nav' | 'hero' | 'banner' | 'inline'

const styles: Record<Variant, string> = {
  nav: 'inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 font-label-md text-white transition-all hover:bg-primary-container active:scale-95',
  hero: 'inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 font-headline-md text-white transition-all hover:shadow-lg hover:bg-primary-container active:scale-95',
  banner:
    'group flex w-full items-center gap-3 rounded-xl border border-primary/15 bg-gradient-to-r from-primary to-secondary p-4 text-white shadow-sm transition-all active:scale-[0.98]',
  inline:
    'inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-container active:scale-95',
}

type Props = {
  variant?: Variant
  className?: string
}

export function AiAgentLink({ variant = 'inline', className = '' }: Props) {
  return (
    <a
      href={aiAgent.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles[variant]} ${className}`.trim()}
      aria-label={`${aiAgent.name}，新窗口打开`}
    >
      {variant === 'banner' ? (
        <>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <Icon name="smart_toy" className="text-white" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col text-left">
            <span className="font-bold">{aiAgent.name}</span>
            <span className="truncate text-[12px] text-white/75">{aiAgent.desc}</span>
          </span>
          <Icon
            name="arrow_outward"
            className="shrink-0 text-white/80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </>
      ) : (
        <>
          <Icon name="smart_toy" />
          <span>{aiAgent.name}</span>
          <Icon name="arrow_outward" className="text-[18px] opacity-80" />
        </>
      )}
    </a>
  )
}
