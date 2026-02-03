import { LoginForm } from '@/components/admin/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--backdrop-primary)] to-[var(--backdrop-secondary)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Sign in to manage your clinics</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <LoginForm />
        </div>

        <p className="text-center mt-6 text-sm text-gray-600">
          Default: admin@example.com / admin123
        </p>
      </div>
    </div>
  );
}
