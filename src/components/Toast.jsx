import { CheckCircle, XCircle } from 'lucide-react'

export default function Toast({ message, type }) {
  return (
    <div className={`toast toast-${type}`}>
      {type === 'error' ? <XCircle size={17} /> : <CheckCircle size={17} />}
      {message}
    </div>
  )
}
