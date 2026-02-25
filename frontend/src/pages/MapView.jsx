import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapPin, ArrowLeft, Locate } from 'lucide-react'
import { formatTimeAgo } from '../utils/formatTime'
import { CONTENT_SERVICE } from '../constants/api'
import api from '../utils/api'
import { parseResponse } from '../utils/parseResponse'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import { useToast } from '../context/ToastContext'

// Fix Leaflet's default marker icon paths (broken by webpack)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom brand-coloured marker
const brandIcon = new L.Icon({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:      [25, 41],
  iconAnchor:    [12, 41],
  popupAnchor:   [1, -34],
  shadowSize:    [41, 41],
})

// "You are here" — blue dot
const userLocationIcon = new L.DivIcon({
  className: 'wandr-user-location-dot',
  html: '<div style="width:16px;height:16px;border-radius:50%;background:var(--brand-500,#6366f1);border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const isRealId = (id) => /^[a-f\d]{24}$/i.test(id)

// Geocode a location string → { lat, lng } via Nominatim
const geocodeCache = {}
async function geocode(locationStr) {
  if (geocodeCache[locationStr]) return geocodeCache[locationStr]
  try {
    const res = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationStr)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' }, timeout: 8000 }
    )
    const parsed = await parseResponse(res)
    if (parsed.ok && Array.isArray(parsed.data) && parsed.data[0]) {
      const coords = { lat: parseFloat(parsed.data[0].lat), lng: parseFloat(parsed.data[0].lon) }
      geocodeCache[locationStr] = coords
      return coords
    }
  } catch (_) {}
  return null
}

// Re-center map when markers load (and optionally include user location)
function MapFit({ points, userLocation }) {
  const map = useMap()
  const fitted = useRef(false)
  useEffect(() => {
    if (fitted.current) return
    const allPoints = [...points.map((p) => [p.lat, p.lng])]
    if (userLocation) allPoints.push([userLocation.lat, userLocation.lng])
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
      fitted.current = true
    }
  }, [points, userLocation, map])
  return null
}

// Fly to user location when they click "My location"
function FlyToUser({ userLocation, trigger }) {
  const map = useMap()
  useEffect(() => {
    if (!userLocation || !trigger) return
    map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1 })
  }, [userLocation, trigger, map])
  return null
}

export default function MapView() {
  const navigate      = useNavigate()
  const toast         = useToast()

  const [markers,       setMarkers]       = useState([])  // [{ lat, lng, posts: [] }]
  const [loading,       setLoading]       = useState(true)
  const [userLocation,  setUserLocation]  = useState(null)   // { lat, lng } or null
  const [locationError, setLocationError] = useState(null)   // string or null
  const [locationLoading, setLocationLoading] = useState(true)
  const [flyToUserTrigger, setFlyToUserTrigger] = useState(0)

  const fetchAndGeocode = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`${CONTENT_SERVICE}/posts?page=1&limit=100`)
      const data = res.data
      const posts = Array.isArray(data) ? data : (data?.posts ?? [])

      // Group posts by location string
      const locationMap = {}
      posts.forEach((p) => {
        if (!p.location) return
        if (!locationMap[p.location]) locationMap[p.location] = []
        locationMap[p.location].push(p)
      })

      // Geocode each unique location (rate limit: sequential with tiny delay)
      const results = []
      for (const [loc, locPosts] of Object.entries(locationMap)) {
        const coords = await geocode(loc)
        if (coords) results.push({ ...coords, locationName: loc, posts: locPosts })
        await new Promise((r) => setTimeout(r, 120)) // Nominatim rate limit
      }

      setMarkers(results)
    } catch (e) {
      toast.error(e?.name === 'AbortError' ? 'Request timed out' : 'Failed to load map posts')
      setMarkers([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchAndGeocode() }, [fetchAndGeocode])

  // Detect current location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported')
      setLocationLoading(false)
      return
    }
    setLocationLoading(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationError(null)
        setLocationLoading(false)
      },
      (err) => {
        setLocationError(err.code === 1 ? 'Location denied' : 'Location unavailable')
        setUserLocation(null)
        setLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [])

  const goToMyLocation = () => {
    if (userLocation) {
      setFlyToUserTrigger((t) => t + 1)
    } else if (!locationLoading && !locationError) {
      // Retry once
      setLocationLoading(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setUserLocation(loc)
          setLocationError(null)
          setLocationLoading(false)
          setFlyToUserTrigger((t) => t + 1)
        },
        () => setLocationLoading(false),
        { enableHighAccuracy: true, timeout: 8000 }
      )
    }
  }

  const totalPosts = markers.reduce((s, m) => s + m.posts.length, 0)

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--surface-nav)', backdropFilter: 'blur(16px) saturate(180%)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '12px var(--content-padding)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}
          style={{ padding: '6px 8px', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={18} />
        </button>
        <MapPin size={18} color="var(--brand-500)" />
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0, flex: 1 }}>
          World Map
        </h1>
        <button
          type="button"
          onClick={goToMyLocation}
          disabled={locationLoading}
          title={userLocation ? 'Center on my location' : locationError || 'Get my location'}
          style={{
            padding: 8,
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
            background: userLocation ? 'var(--brand-500)' : 'var(--surface-elevated)',
            color: userLocation ? 'white' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Locate size={18} />
        </button>
        {!loading && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 'var(--weight-medium)' }}>
            {totalPosts} post{totalPosts !== 1 ? 's' : ''} · {markers.length} location{markers.length !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 60, minHeight: 300 }}>
          <div className="spinner spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Geocoding locations…</p>
        </div>
      ) : (
        <>
          {/* Map */}
          <div style={{ height: 'calc(100vh - 130px)', width: '100%', position: 'relative' }}>
            <MapContainer
              center={[20, 0]}
              zoom={2}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapFit points={markers} userLocation={userLocation} />
              <FlyToUser userLocation={userLocation} trigger={flyToUserTrigger} />

              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userLocationIcon}>
                  <Popup>You are here</Popup>
                </Marker>
              )}

              {markers.map((m, i) => (
                <Marker key={i} position={[m.lat, m.lng]} icon={brandIcon}>
                  <Popup maxWidth={260} className="wandr-popup">
                    <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: 200 }}>
                      {/* Location name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                        <MapPin size={13} color="#6366f1" />
                        <strong style={{ fontSize: 14 }}>{m.locationName}</strong>
                        <span style={{ fontSize: 11, color: '#888', marginLeft: 'auto' }}>
                          {m.posts.length} post{m.posts.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Post previews (up to 3) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {m.posts.slice(0, 3).map((p, pi) => (
                          <div
                            key={pi}
                            style={{ display: 'flex', gap: 8, cursor: isRealId(p._id) ? 'pointer' : 'default', alignItems: 'center' }}
                            onClick={() => isRealId(p._id) && navigate(`/posts/${p._id}`)}
                          >
                            <img
                              src={p.image}
                              alt="post"
                              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                              onError={(e) => { e.target.src = `https://picsum.photos/seed/${p._id}/80/80` }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 12, margin: '0 0 2px', color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                                {p.caption?.split('📍')[0]?.trim() || 'Untitled'}
                              </p>
                              <span style={{ fontSize: 11, color: '#888' }}>
                                {formatTimeAgo(p.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {m.posts.length > 3 && (
                          <p style={{ fontSize: 11, color: '#6366f1', margin: 0, textAlign: 'center' }}>
                            +{m.posts.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {markers.length === 0 && !loading && (
            <div className="empty-state" style={{ marginTop: 40 }}>
              <div className="empty-state-icon"><MapPin size={28} /></div>
              <h3>No mapped posts yet</h3>
              <p>Posts with location data will appear on the map.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
