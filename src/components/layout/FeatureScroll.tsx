import { useChat } from '../chat/ChatContext'
import { isPrimaryFeature } from '../../lib/featureOrder'

export default function FeatureScroll() {
  const { features, featureId, setFeatureId } = useChat()

  return (
    <div className="feature-scroll" role="tablist" aria-label="场景功能">
      {features.map((feature) => (
        <button
          key={feature.id}
          type="button"
          role="tab"
          className={`feature-pill${feature.id === featureId ? ' active' : ''}${
            isPrimaryFeature(feature.id) ? ' feature-pill--primary' : ''
          }`}
          aria-selected={feature.id === featureId}
          title={feature.description}
          onClick={() => setFeatureId(feature.id)}
        >
          {feature.icon} {feature.name}
        </button>
      ))}
    </div>
  )
}
