'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required').optional(),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState('')
  const router = useRouter()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setApiError('')

    try {
      if (showPassword && data.password) {
        // Password login flow
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, password: data.password }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Login failed')
        }

        // Store token
        localStorage.setItem('token', result.token)
        document.cookie = `token=${result.token}; path=/; max-age=${7 * 24 * 60 * 60}`

        // Redirect based on role
        if (result.user.app_role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      } else {
        // Magic link flow
        console.log('Send magic link to:', data.email)
        // TODO: Implement magic link API call
        form.setError('root', { message: 'Magic link feature coming soon. Please use password login.' })
      }
    } catch (error: any) {
      setApiError(error.message)
      form.setError('root', { message: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Message */}
        {(apiError || form.formState.errors.root) && (
          <div className="rounded-md bg-destructive/10 p-3 border border-destructive/20">
            <p className="text-sm text-destructive">
              {apiError || form.formState.errors.root?.message}
            </p>
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                  disabled={isLoading}
                  className="h-12"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showPassword && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                    disabled={isLoading}
                    className="h-12"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold"
          disabled={isLoading}
        >
          {isLoading
            ? 'Processing...'
            : showPassword
            ? 'Sign in'
            : 'Send Magic Link'}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
          >
            {showPassword ? 'Use magic link instead' : 'Or sign in with password'}
          </button>
        </div>
      </form>
    </Form>
  )
}
