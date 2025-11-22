import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/context/AuthContext'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import logo from '@/images/logo_stoockops.jpg'

const SignUp = () => {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)

  const password = watch('password')

  const onSubmit = async (data) => {
    setLoading(true)
    const result = await signup(data.loginId, data.email, data.password)
    setLoading(false)
    
    if (result.success) {
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } else {
      toast.error(result.error || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <img src={logo} alt="StockOps Logo" className="h-16 w-auto mb-4" />
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <Input
              label="Login ID"
              type="text"
              {...register('loginId', { 
                required: 'Login ID is required',
                minLength: {
                  value: 6,
                  message: 'Login ID must be at least 6 characters'
                },
                maxLength: {
                  value: 12,
                  message: 'Login ID must be at most 12 characters'
                }
              })}
              error={errors.loginId?.message}
            />
            <Input
              label="Email address"
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              error={errors.email?.message}
            />
            <Input
              label="Password"
              type="password"
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be more than 8 characters'
                },
                validate: (value) => {
                  const hasLowerCase = /[a-z]/.test(value)
                  const hasUpperCase = /[A-Z]/.test(value)
                  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value)
                  
                  if (!hasLowerCase) {
                    return 'Password must contain at least one lowercase letter'
                  }
                  if (!hasUpperCase) {
                    return 'Password must contain at least one uppercase letter'
                  }
                  if (!hasSpecialChar) {
                    return 'Password must contain at least one special character'
                  }
                  return true
                }
              })}
              error={errors.password?.message}
            />
            <Input
              label="Confirm Password"
              type="password"
              {...register('confirmPassword', { 
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
              error={errors.confirmPassword?.message}
            />
          </div>

          <div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-500">
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SignUp

