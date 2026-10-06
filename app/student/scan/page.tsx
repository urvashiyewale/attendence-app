'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  GraduationCap,
  Loader2,
  MapPin,
  Navigation,
  QrCode,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type ScanState = 'idle' | 'scanning' | 'verifying' | 'success' | 'error'

export default function StudentScanPage() {
  const [scanState, setScanState] = useState<ScanState>('scanning')
  const [resultMode, setResultMode] = useState<'attendance' | 'enrollment'>('attendance')
  const [cameraError, setCameraError] = useState<string>('')
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null)
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  const [gpsStatus, setGpsStatus] = useState<string>('Detecting location…')
  const [resultMessage, setResultMessage] = useState<string>('')
  const [resultData, setResultData] = useState<any>(null)
  const scannerRef = useRef<any>(null)

  // Manual fallback inputs
  const [showManual, setShowManual] = useState(false)
  const [manualSessionId, setManualSessionId] = useState('')
  const [manualToken, setManualToken] = useState('')

  const isScanningRef = useRef(false)

  // 1. Get Geolocation & Start Camera Scanner on mount
  useEffect(() => {
    obtainLocation()
    startScanner()

    return () => {
      isScanningRef.current = false
      if (scannerRef.current) {
        try {
          scannerRef.current.stop()
        } catch {}
      }
    }
  }, [])

  function obtainLocation() {
    setGpsStatus('Requesting GPS coordinates…')
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported by device.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
        setGpsAccuracy(Math.round(pos.coords.accuracy))
        setGpsStatus(`GPS Active (±${Math.round(pos.coords.accuracy)}m accuracy)`)
      },
      (err) => {
        console.warn('Geolocation warning:', err)
        setGpsStatus('Location unavailable. Please enable device GPS.')
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  // 2. Start Camera Scanner Directly
  async function startScanner() {
    setCameraError('')
    setScanState('scanning')
    isScanningRef.current = true

    try {
      // Dynamic import to avoid SSR errors with window/navigator
      const { Html5Qrcode } = await import('html5-qrcode')

      // Clean up previous instance if any
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop()
        } catch {}
      }

      const html5QrCode = new Html5Qrcode('qr-reader-container')
      scannerRef.current = html5QrCode

      const config = {
        fps: 15,
        qrbox: { width: 260, height: 260 },
        aspectRatio: 1.0,
      }

      await html5QrCode.start(
        { facingMode: 'environment' }, // Rear camera on mobile
        config,
        async (decodedText) => {
          // Prevent multiple trigger calls
          if (!isScanningRef.current) return
          isScanningRef.current = false

          try {
            await html5QrCode.stop()
          } catch {}

          handleQrDecoded(decodedText)
        },
        () => {
          // Frame processed, QR not yet visible
        }
      )
    } catch (err: any) {
      console.error('Camera start error:', err)
      setCameraError(err?.message || 'Could not access device camera. Please check camera permissions.')
      setScanState('error')
      isScanningRef.current = false
    }
  }

  // 3. Stop Scanner Cleanup
  async function stopScanner() {
    isScanningRef.current = false
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch {}
    }
    setScanState('idle')
  }

  // 4. Handle Scanned QR Data & Send Verification Request
  async function handleQrDecoded(text: string) {
    setScanState('verifying')
    setResultMessage('')

    let sessionId = ''
    let token = ''
    let enrollmentClassId = ''
    let courseNameHint = ''

    try {
      // Try JSON payload first
      const parsed = JSON.parse(text)
      if (parsed.type === 'enrollment' || (parsed.classId && !parsed.sessionId)) {
        enrollmentClassId = parsed.classId
        courseNameHint = parsed.courseName || ''
      } else {
        sessionId = parsed.sessionId || parsed.session_id
        token = parsed.token
      }
    } catch {
      // Try URL parameters or raw format
      try {
        const url = new URL(text)
        if (url.searchParams.has('join')) {
          enrollmentClassId = url.searchParams.get('join') || ''
        } else {
          sessionId = url.searchParams.get('session') || ''
          token = url.searchParams.get('token') || ''
        }
      } catch {
        // Fallback: pipe/colon separated "sessionId:token"
        const parts = text.split(':')
        if (parts.length === 2) {
          sessionId = parts[0]
          token = parts[1]
        }
      }
    }

    // If an Enrollment QR code was scanned
    if (enrollmentClassId) {
      await handleEnrollmentScan(enrollmentClassId, courseNameHint)
      return
    }

    if (!sessionId || !token) {
      setScanState('error')
      setResultMessage('Invalid QR Code. Please scan the official classroom QR code displayed by your instructor.')
      return
    }

    await submitVerification(sessionId, token)
  }

  async function handleEnrollmentScan(classId: string, courseNameHint?: string) {
    try {
      const res = await fetch('/api/student/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setResultMode('enrollment')
        setScanState('success')
        setResultMessage(data.message || `Successfully enrolled into ${courseNameHint || 'class'}!`)
        setResultData(data.data || { courseName: courseNameHint || 'Enrolled Class' })
      } else {
        setResultMode('enrollment')
        setScanState('error')
        setResultMessage(data.message || 'Could not enroll into class.')
      }
    } catch {
      setResultMode('enrollment')
      setScanState('error')
      setResultMessage('Network error while processing class enrollment.')
    }
  }

  // 5. Submit to Verification Endpoint
  async function submitVerification(sessionId: string, token: string) {
    setScanState('verifying')

    // Always get fresh coordinates
    let lat = gpsCoords?.latitude || 0
    let lng = gpsCoords?.longitude || 0

    if ((!lat || !lng) && navigator.geolocation) {
      try {
        const pos: GeolocationPosition = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          })
        })
        lat = pos.coords.latitude
        lng = pos.coords.longitude
        setGpsCoords({ latitude: lat, longitude: lng })
      } catch (err) {
        console.warn('Could not acquire real-time coords:', err)
      }
    }

    if (!lat || !lng) {
      setResultMode('attendance')
      setScanState('error')
      setResultMessage(
        'GPS location is required to verify that you are present in the classroom. Please turn on device location & allow browser permissions, then try scanning again.'
      )
      setResultData({ errorType: 'gps_required' })
      return
    }

    try {
      const response = await fetch('/api/attendance/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          token,
          latitude: lat,
          longitude: lng,
        }),
      })

      const data = await response.json()

      if (response.ok && data.ok) {
        setResultMode('attendance')
        setScanState('success')
        setResultMessage(data.message || 'Attendance verified and recorded successfully!')
        setResultData(data.data)
      } else {
        setResultMode('attendance')
        setScanState('error')
        setResultMessage(data.message || 'Attendance verification failed.')
        setResultData(data)
      }
    } catch (err) {
      console.error('Verification error:', err)
      setResultMode('attendance')
      setScanState('error')
      setResultMessage('Network error during verification. Please check your connection and try again.')
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const sId = manualSessionId.trim()
    const tok = manualToken.trim()

    if (!sId) {
      setResultMessage('Please enter a valid Session ID.')
      return
    }
    if (!tok || tok.length < 16) {
      setResultMessage('Please enter a valid attendance QR token.')
      return
    }
    submitVerification(sId, tok)
  }

  function resetToScanAgain() {
    setScanState('idle')
    setResultMessage('')
    setResultData(null)
    setCameraError('')
    startScanner()
  }

  return (
    <DashboardLayout role="student">
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <Link
            href="/student"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#6558ee]"
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>
          <div className="mt-2 flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6558ee]">Student Attendance</span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Scan Classroom QR</h1>
            <p className="text-sm text-slate-500">
              Point your camera at the instructor&apos;s 15-second rotating screen QR code. Your location will be verified automatically.
            </p>
          </div>
        </div>

        {/* GPS Status Indicator */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs text-xs">
          <div className="flex items-center gap-2.5">
            <div className={`size-2 rounded-full ${gpsCoords ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <div>
              <span className="font-semibold text-slate-800">Location Status: </span>
              <span className="text-slate-600">{gpsStatus}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={obtainLocation} className="h-7 text-xs text-[#6558ee] gap-1">
            <RefreshCw className="size-3" /> Refresh GPS
          </Button>
        </div>

        {/* Scan Results: SUCCESS */}
        {scanState === 'success' && (
          <Card className="border-emerald-300 bg-emerald-50/60 shadow-lg text-emerald-950 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {resultMode === 'enrollment' ? (
              <>
                <div className="bg-emerald-600 p-4 text-white flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/20">
                    <GraduationCap className="size-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Enrolled in Class!</h3>
                    <p className="text-xs text-emerald-100">You are now officially registered on this class roster.</p>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-xl bg-white p-4 border border-emerald-200 space-y-2 shadow-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-xs text-slate-500 font-medium">Course</span>
                      <span className="text-sm font-bold text-slate-900">
                        {resultData?.courseName || 'Class Course'} {resultData?.courseCode ? `(${resultData.courseCode})` : ''}
                      </span>
                    </div>
                    {resultData?.className && (
                      <div className="flex justify-between items-center border-b border-slate-100 py-2">
                        <span className="text-xs text-slate-500 font-medium">Section</span>
                        <span className="text-xs font-semibold text-slate-800">{resultData.className}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-slate-500 font-medium">Status</span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        ✓ Active Enrollment
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-emerald-800 text-center font-medium">
                    {resultMessage || 'Your enrollment has been successfully recorded.'}
                  </p>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={resetToScanAgain}
                      variant="outline"
                      className="flex-1 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                    >
                      <RefreshCw className="size-4 mr-2" /> Scan Another QR
                    </Button>
                    <Link href="/student/courses" className="flex-1">
                      <Button className="w-full bg-[#6558ee] text-white hover:bg-[#5549d8]">
                        <BookOpen className="size-4 mr-2" /> View Enrolled Courses
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </>
            ) : (
              <>
                <div className="bg-emerald-600 p-4 text-white flex items-center gap-3">
                  <CheckCircle2 className="size-7 shrink-0" />
                  <div>
                    <h3 className="font-bold text-base">Attendance Verified!</h3>
                    <p className="text-xs text-emerald-100">Your presence has been officially recorded in the database.</p>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-xl bg-white p-4 border border-emerald-200 space-y-2 shadow-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-xs text-slate-500 font-medium">Course</span>
                      <span className="text-sm font-bold text-slate-900">
                        {resultData?.courseName} ({resultData?.courseCode})
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 py-2">
                      <span className="text-xs text-slate-500 font-medium">Recorded At</span>
                      <span className="text-xs font-mono text-slate-800">
                        {resultData?.markedAt ? new Date(resultData.markedAt).toLocaleTimeString() : 'Just now'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-slate-500 font-medium">Classroom Distance</span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {resultData?.distanceMeters !== null ? `✓ ${resultData?.distanceMeters}m away` : '✓ Geofence Verified'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={resetToScanAgain}
                      variant="outline"
                      className="flex-1 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                    >
                      <RefreshCw className="size-4 mr-2" /> Scan Another Class
                    </Button>
                    <Link href="/student/attendance" className="flex-1">
                      <Button className="w-full bg-emerald-700 text-white hover:bg-emerald-800">
                        <FileCheck2 className="size-4 mr-2" /> View Attendance History
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        )}

        {/* Scan Results: ERROR */}
        {scanState === 'error' && (
          <Card className="border-rose-300 bg-rose-50/60 shadow-lg text-rose-950 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {resultData?.errorType === 'expired_qr' || resultMessage?.toLowerCase().includes('expired') ? (
              <>
                <div className="bg-amber-600 p-4 text-white flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/20">
                    <Clock className="size-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">QR Code Has Expired</h3>
                    <p className="text-xs text-amber-100">Dynamic 15-second rotation window elapsed</p>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-xl bg-white p-4 border border-amber-200 text-sm text-amber-900 leading-relaxed space-y-2 shadow-xs">
                    <p className="font-semibold text-slate-900">
                      The dynamic QR code on the instructor&apos;s screen has already refreshed.
                    </p>
                    <p className="text-xs text-slate-600">
                      Attendly uses high-security 15-second rotating cryptographic tokens to prevent proxy attendance and screenshot sharing.
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                    <RefreshCw className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>What to do:</strong> Look up at the classroom projector screen and scan the fresh QR code currently shown.
                    </span>
                  </div>

                  <Button
                    onClick={resetToScanAgain}
                    className="w-full bg-[#6558ee] font-semibold text-white hover:bg-[#5549d8]"
                  >
                    <Camera className="size-4 mr-2" /> Scan Current Screen QR
                  </Button>
                </CardContent>
              </>
            ) : resultData?.errorType === 'geofence_violation' || resultData?.distance ? (
              <>
                <div className="bg-rose-600 p-4 text-white flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/20">
                    <Navigation className="size-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Location Verification Failed</h3>
                    <p className="text-xs text-rose-100">Outside permitted classroom geofence</p>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-xl bg-white p-4 border border-rose-200 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                      <span className="text-slate-500 font-medium">Your Measured Distance:</span>
                      <span className="font-mono font-bold text-rose-600 text-sm">
                        {resultData?.distance} meters away
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-b border-slate-100 py-1.5">
                      <span className="text-slate-500 font-medium">Classroom Allowed Radius:</span>
                      <span className="font-mono font-bold text-slate-800">
                        ±{resultData?.allowedRadius || 100} meters
                      </span>
                    </div>
                    <p className="text-xs text-rose-700 pt-1 leading-relaxed">
                      {resultMessage || `You must be inside the classroom to verify attendance. You are currently ${resultData.distance}m away.`}
                    </p>
                  </div>

                  <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 flex items-start gap-2">
                    <MapPin className="size-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      Please enter the lecture hall or ensure your phone&apos;s GPS has high-accuracy location enabled.
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={obtainLocation}
                      variant="outline"
                      className="flex-1 border-rose-300 text-rose-800 hover:bg-rose-100"
                    >
                      <Compass className="size-4 mr-2" /> Recalibrate GPS
                    </Button>
                    <Button
                      onClick={resetToScanAgain}
                      className="flex-1 bg-rose-600 font-semibold text-white hover:bg-rose-700"
                    >
                      <RefreshCw className="size-4 mr-2" /> Try Again
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <>
                <div className="bg-rose-600 p-4 text-white flex items-center gap-3">
                  <ShieldAlert className="size-7 shrink-0" />
                  <div>
                    <h3 className="font-bold text-base">Verification Rejected</h3>
                    <p className="text-xs text-rose-100">Unable to mark attendance for this session.</p>
                  </div>
                </div>
                <CardContent className="p-6 space-y-4">
                  <div className="rounded-xl bg-white p-4 border border-rose-200 text-sm text-rose-800 leading-relaxed shadow-xs">
                    {resultMessage || cameraError || 'Attendance could not be confirmed.'}
                  </div>

                  <Button
                    onClick={resetToScanAgain}
                    className="w-full bg-rose-600 font-semibold text-white hover:bg-rose-700"
                  >
                    <RefreshCw className="size-4 mr-2" /> Try Scanning Again
                  </Button>
                </CardContent>
              </>
            )}
          </Card>
        )}

        {/* Camera Scanner View */}
        {scanState !== 'success' && scanState !== 'error' && (
          <Card className="border-slate-200 shadow-md overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 text-white p-3.5 sm:p-4">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Camera className="size-4 text-[#6558ee]" /> Live Camera Scanner
              </CardTitle>
              <CardDescription className="text-[11px] sm:text-xs text-slate-300">
                Grant camera permission when prompted by your browser
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 flex flex-col items-center">
              {/* QR Container element for html5-qrcode */}
              <div className="relative w-full max-w-[320px] sm:max-w-[340px] aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 bg-black flex items-center justify-center">
                <div id="qr-reader-container" className="w-full h-full" />

                {scanState === 'idle' && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 sm:p-6 text-center text-white gap-3 sm:gap-4 overflow-hidden">
                    <img
                      src="/images/scanner-mockup.jpg"
                      alt="Scanner guide"
                      className="absolute inset-0 h-full w-full object-cover opacity-25"
                    />
                    <div className="relative z-10 size-14 sm:size-16 rounded-2xl bg-[#6558ee]/20 flex items-center justify-center text-white border border-white/10 shadow-sm">
                      <QrCode className="size-7 sm:size-8 text-white" />
                    </div>
                    <div className="relative z-10">
                      <h4 className="font-bold text-sm sm:text-base">Ready to Scan</h4>
                      <p className="text-[11px] sm:text-xs text-slate-300 mt-1">Point your camera at the rotating classroom QR display</p>
                    </div>
                    <Button
                      onClick={startScanner}
                      className="relative z-10 bg-[#6558ee] hover:bg-[#5549d8] text-white rounded-xl font-bold shadow-lg shadow-[#6558ee]/40 px-5 sm:px-6 py-2 text-xs sm:text-sm"
                    >
                      <Camera className="size-4 mr-2" /> Open Camera
                    </Button>
                  </div>
                )}

                {scanState === 'verifying' && (
                  <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center text-white gap-3">
                    <Loader2 className="size-10 animate-spin text-[#6558ee]" />
                    <p className="font-semibold text-sm">Verifying with Server…</p>
                    <p className="text-xs text-slate-400">Validating token expiry and GPS coordinates</p>
                  </div>
                )}
              </div>

              {scanState === 'scanning' && (
                <div className="mt-3.5 sm:mt-4 flex flex-col items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold animate-pulse">
                    <span className="size-2 rounded-full bg-emerald-500" /> Camera active · Scanning code
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopScanner}
                    className="text-xs text-slate-600 border-slate-300 h-8"
                  >
                    Cancel Scan
                  </Button>
                </div>
              )}
            </CardContent>

            <div className="border-t border-slate-100 bg-slate-50 p-4 flex items-center justify-between text-xs text-slate-500">
              <span>Having camera issues?</span>
              <button
                type="button"
                onClick={() => setShowManual(!showManual)}
                className="font-semibold text-[#6558ee] hover:underline"
              >
                {showManual ? 'Hide manual entry' : 'Enter code manually'}
              </button>
            </div>
          </Card>
        )}

        {/* Manual Code Fallback */}
        {showManual && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Manual Verification Code</CardTitle>
              <CardDescription className="text-xs">
                If your camera cannot scan, enter the session and token directly
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Session ID</label>
                  <Input
                    value={manualSessionId}
                    onChange={(e) => setManualSessionId(e.target.value)}
                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                    className="mt-1 font-mono text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Token</label>
                  <Input
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Enter current 15-second token"
                    className="mt-1 font-mono text-xs"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={scanState === 'verifying'}
                  className="w-full bg-[#6558ee] text-xs font-semibold text-white hover:bg-[#5549d8]"
                >
                  Verify Attendance
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
