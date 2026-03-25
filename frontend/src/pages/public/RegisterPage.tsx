import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '@/api/endpoints/auth.api'
import { useAuthStore } from '@/store/auth.store'

const schema = z.object({
  firstName: z.string().min(1, 'Required').max(100),
  lastName: z.string().min(1, 'Required').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth({ ...data, fullName: '', role: 'Client' })
      navigate('/client/browse', { replace: true })
    },
  })

  const fields = [
    { name: 'firstName' as const, label: 'First name', type: 'text' },
    { name: 'lastName' as const, label: 'Last name', type: 'text' },
    { name: 'email' as const, label: 'Email', type: 'email' },
    { name: 'password' as const, label: 'Password', type: 'password' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create an account</h1>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {fields.map(({ name, label, type }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input {...register(name)} type={type}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {errors[name] && <p className="text-xs text-red-600 mt-1">{errors[name]?.message}</p>}
            </div>
          ))}

          <button type="submit" disabled={mutation.isPending}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors">
            {mutation.isPending ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
