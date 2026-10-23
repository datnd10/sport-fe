export const orderMoney = (value: number) => value.toLocaleString('vi-VN') + ' đ'
export const orderDate = (value: string) => new Date(value).toLocaleString('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
})
export const paymentLabels = { COD: 'Thanh toán khi nhận hàng', BANK_TRANSFER: 'Chuyển khoản ngân hàng' }
