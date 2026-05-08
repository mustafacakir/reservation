import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { Users, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import type { PagedResult } from '@/types/common.types'

interface AdminUser {
  id: string
  fullName: string
  email: string
  role: string
  createdAt: string
  lastLoginAt: string | null
}

const ROLE_FILTERS = [
  { key: '',                label: 'Tümü' },
  { key: 'ServiceProvider', label: 'Öğretmenler' },
  { key: 'Client',          label: 'Öğrenciler' },
]

const ROLE_BADGE: Record<string, string> = {
  ServiceProvider: 'bg-blue-100 text-blue-700',
  Client:          'bg-gray-100 text-gray-600',
  Admin:           'bg-violet-100 text-violet-700',
  SuperAdmin:      'bg-red-100 text-red-700',
}

const ROLE_LABEL: Record<string, string> = {
  ServiceProvider: 'Öğretmen',
  Client:          'Öğrenci',
  Admin:           'Admin',
  SuperAdmin:      'Süper Admin',
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function AdminUsersPage() {
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery<PagedResult<AdminUser>>({
    queryKey: ['adminUsers', role, page],
    queryFn: () =>
      apiClient.get('/admin/users', { params: { role: role || undefined, page, pageSize: 20 } }).then((r) => r.data),
  })

  const filtered = search.trim()
    ? data?.items.filter(
        (u) =>
          u.fullName.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : data?.items

  function handleRoleChange(key: string) {
    setRole(key)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Kullanıcılar</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {data ? `${data.totalCount} kullanıcı` : 'Yükleniyor...'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {ROLE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleRoleChange(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                role === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="İsim veya e-posta ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-100 rounded animate-pulse w-32" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : !filtered?.length ? (
          <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
            <Users size={32} className="text-gray-200" />
            <p className="text-sm">Kullanıcı bulunamadı.</p>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[2fr_2fr_1fr_1fr_1fr] px-5 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <span>Kullanıcı</span>
              <span>E-posta</span>
              <span>Rol</span>
              <span>Kayıt</span>
              <span>Son giriş</span>
            </div>
            <div className="divide-y divide-gray-50">
              {filtered.map((u) => (
                <div
                  key={u.id}
                  className="px-5 py-3 grid grid-cols-1 sm:grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-y-1 items-center hover:bg-gray-50/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                      {initials(u.fullName)}
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate">{u.fullName}</span>
                  </div>
                  <span className="text-sm text-gray-500 truncate sm:pl-0 pl-12">{u.email}</span>
                  <span>
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </span>
                  <span className="text-xs text-gray-400 sm:block hidden">{fmtDate(u.createdAt)}</span>
                  <span className="text-xs text-gray-400 sm:block hidden">
                    {u.lastLoginAt ? fmtDate(u.lastLoginAt) : '—'}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Sayfa {data.page} / {data.totalPages}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
