export type NotificationDto = {
  id: string
  title: string
  body: string
  type: string
  referenceId: string | null
  imageUrl: string | null
  isRead: boolean
  createdAt: string
}
