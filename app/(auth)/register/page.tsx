import SupportChat from '@/components/SupportChat'
import { Input } from '@/components/ui/input'
import { Eye } from 'lucide-react'
import React from 'react'

const registerPage = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8">
        <div className="bg-green-500 text-white text-3xl font-bold px-6 py-3 rounded">Andes</div>
      </div>
      
      {/* Registration Form */}
      <div className="w-full max-w-md space-y-4">
        {/* Email Input */}
        <Input
          type="email"
          placeholder="please Input your email"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
        />
        
        {/* Password Input */}
        <div className="relative">
          <Input
            type="password"
            placeholder="Please enter your password"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 pr-10"
          />
          <Eye className='h-5 w-5'/>
        </div>
        
        {/* Confirm Password Input */}
        <div className="relative">
          <Input
            type="password"
            placeholder="Please confirm your password"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 pr-10"
          />
          <Eye className='h-5 w-5'/>
        </div>
        
        {/* Transaction Password Input */}
        <div className="relative">
          <Input
            type="password"
            placeholder="Please enter transaction password"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 pr-10"
          />
          <Eye className='h-5 w-5'/>
        </div>
        
        {/* Invitation Code Input */}
        <Input
          type="text"
          placeholder="Please enter the invitation code"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
        />
        
        {/* Telegram Input */}
        <Input
          type="text"
          placeholder="telegram"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
        />
        
        {/* Sign Up Button */}
        <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200">
          Sign up now
        </button>
        
        {/* Login Link */}
        <div className="text-center text-gray-600">
          Already have an account? <a href="#" className="text-blue-600 font-bold hover:underline">Log in</a>
        </div>
      </div>
      
      {/* Support Chat Icon */}
      <SupportChat/>
    </div>
  )
}

export default registerPage