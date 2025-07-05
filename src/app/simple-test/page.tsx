'use client'

export default function SimpleTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Simple Test Page</h1>
      <p>If you can see this, the routing works!</p>
      <button 
        onClick={() => alert('Button works!')}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        Test Button
      </button>
    </div>
  )
}