import { useNavigate, useParams } from 'react-router-dom'
import { OrderDetailView } from '@/components/organisms/order-detail-view'
import { vendorPath } from '@/constants/routes'

export function OrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return (
    <div className="pb-10 lg:pb-12">
      {/* Full-width detail view */}
      <div className="mx-auto max-w-2xl">
        <OrderDetailView
          orderId={id}
          onReorderSuccess={(vendorId) => navigate(vendorPath(vendorId))}
        />
      </div>
    </div>
  )
}
