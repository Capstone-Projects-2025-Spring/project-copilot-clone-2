import { useNavigate } from 'react-router-dom'

const SignUpForm = () => {
  const navigate = useNavigate()

  return (
    <div>
      <button
        onClick={() => navigate('/login')}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Go to Login
      </button>
    </div>
  )
}

export default SignUpForm