import { FlagValues } from 'flags/react'
import { FEATURE_FLAGS } from '@/lib/feature-flags'

/**
 * Emits current feature flag values to the DOM so Vercel Analytics
 * can read them and annotate page views in the Flags tab.
 */
export default function FeatureFlagValues() {
  return <FlagValues values={FEATURE_FLAGS} />
}
