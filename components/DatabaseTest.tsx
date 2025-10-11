import { supabase } from '../lib/supabase'

export default function DatabaseTest() {
  const testConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('id', 1)
        .single()
      
      if (error) {
        console.error('Database connection error:', error)
        alert('Database connection failed: ' + error.message)
      } else {
        console.log('Database connected successfully:', data)
        alert('Database connected successfully! Progress data: ' + JSON.stringify(data))
      }
    } catch (err) {
      console.error('Connection test failed:', err)
      alert('Connection test failed: ' + err)
    }
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg mb-4">
      <h3 className="text-lg font-bold mb-2">Database Connection Test</h3>
      <button 
        onClick={testConnection}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Test Supabase Connection
      </button>
    </div>
  )
}