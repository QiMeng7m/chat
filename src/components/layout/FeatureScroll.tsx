import { useChat } from '../chat/ChatContext'

export default function FeatureScroll() {
  const { features, featureId, setFeatureId } = useChat()

  return (
    <div className="feature-scroll" role="tablist" aria-label="场景功能">
      {features.map((feature) => (
        <button
          key={feature.id}
          type="button"
          role="tab"
          className={`feature-pill${feature.id === featureId ? ' active' : ''}`}
          aria-selected={feature.id === featureId}
          onClick={() => setFeatureId(feature.id)}
        >
          {feature.icon} {feature.name.length > 5 ? feature.name.slice(0, 4) : feature.name}
        </button>
      ))}
    </div>
  )
}
