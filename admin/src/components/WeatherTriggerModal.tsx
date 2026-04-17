import { useState } from 'react'
import { AlertTriangle, CheckCircle, Loader, CloudRain, Thermometer } from 'lucide-react'

interface WeatherTriggerModalProps {
  isOpen: boolean
  onClose: () => void
  onTrigger: (data: { zone: string; triggerType: string; amount: number }) => void
  isLoading: boolean
}

export default function WeatherTriggerModal({ isOpen, onClose, onTrigger, isLoading }: WeatherTriggerModalProps) {
  const [selectedZone, setSelectedZone] = useState('')
  const [triggerType, setTriggerType] = useState('RAIN')
  const [amount, setAmount] = useState('500')
  const [success, setSuccess] = useState(false)

  const zones = [
    'MZ-DEL-04',
    'MZ-DEL-09',
    'MZ-MUM-12',
    'MZ-BLR-07',
    'MZ-HYD-03',
    'MZ-CHN-05',
    'MZ-PUN-02',
  ]

  const handleSubmit = async () => {
    if (!selectedZone || !amount) return
    await onTrigger({
      zone: selectedZone,
      triggerType,
      amount: parseInt(amount),
    })
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      onClose()
      setSelectedZone('')
      setTriggerType('RAIN')
      setAmount('500')
    }, 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900">Weather Alert Trigger</h2>
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">Payout Triggered!</p>
            <p className="text-sm text-gray-600">All active riders in {selectedZone} received auto-payout</p>
          </div>
        ) : (
          <>
            <div className="space-y-5">
              {/* Zone Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Zone <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Choose a zone...</option>
                  {zones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Trigger Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Weather Trigger Type <span className="text-red-600">*</span>
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTriggerType('RAIN')}
                    disabled={isLoading}
                    className={`flex-1 py-2.5 px-3 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
                      triggerType === 'RAIN'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    <CloudRain className="w-4 h-4" />
                    Heavy Rain
                  </button>
                  <button
                    onClick={() => setTriggerType('HEAT')}
                    disabled={isLoading}
                    className={`flex-1 py-2.5 px-3 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
                      triggerType === 'HEAT'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    <Thermometer className="w-4 h-4" />
                    Extreme Heat
                  </button>
                </div>
              </div>

              {/* Payout Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Payout Amount Per Rider (₹) <span className="text-red-600">*</span>
                </label>
                <select
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                  <option value="">Select amount...</option>
                  <option value="300">₹300 (BASIC)</option>
                  <option value="500">₹500 (STANDARD)</option>
                  <option value="1000">₹1000 (PRO)</option>
                  <option value="250">₹250 (Custom)</option>
                </select>
              </div>

              {/* Warning */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-700">
                  ⚠️ This will trigger auto-payment to all active riders in the selected zone immediately.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedZone || !amount || isLoading}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-white flex items-center justify-center gap-2 transition ${
                  !selectedZone || !amount || isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Trigger Payout
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
