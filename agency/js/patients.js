const API_BASE_URL = 'https://greenyellow-hawk-206191.hostingersite.com';

let currentPage = 1;
const pageLimit = 20;
let activeFilters = { status: '', search: '' };

function getStoredUserData() {
    const userDataStr = localStorage.getItem('userData');
    const userRole = localStorage.getItem('userRole');
    const csrfToken = localStorage.getItem('csrf_token');
    return userDataStr
        ? { user: JSON.parse(userDataStr), role: userRole, csrfToken: csrfToken }
        : null;
}

function getHeaders() {
    const stored = getStoredUserData();
    if (!stored) {
        throw new Error('No user data found. Please login again.');
    }
    return {
        Authorization: `Bearer ${stored.user.api_key}`,
        'X-CSRF-Token': stored.csrfToken,
        'Content-Type': 'application/json',
    };
}

function loadUserBar() {
    const stored = getStoredUserData();
    if (!stored || !stored.user) return;
    const u = stored.user;
    const nameEl = document.getElementById('userName');
    const initialsEl = document.getElementById('userInitials');
    const roleEl = document.getElementById('userRole');
    const full = `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Agency user';
    if (nameEl) nameEl.textContent = full;
    if (roleEl) roleEl.textContent = u.role || 'Agency';
    if (initialsEl) {
        const i1 = (u.first_name || '?').charAt(0);
        const i2 = (u.last_name || '').charAt(0);
        initialsEl.textContent = (i1 + i2).toUpperCase() || 'A';
    }
}

function showLoading() {
    document.getElementById('loadingState')?.classList.remove('hidden');
    document.getElementById('errorState')?.classList.add('hidden');
    document.getElementById('contentSection')?.classList.add('hidden');
}

function showError(msg) {
    document.getElementById('loadingState')?.classList.add('hidden');
    document.getElementById('errorState')?.classList.remove('hidden');
    document.getElementById('contentSection')?.classList.add('hidden');
    const em = document.getElementById('errorMessage');
    if (em) em.textContent = msg;
}

function showContent() {
    document.getElementById('loadingState')?.classList.add('hidden');
    document.getElementById('errorState')?.classList.add('hidden');
    document.getElementById('contentSection')?.classList.remove('hidden');
}

function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString();
}

function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function renderPagination(pagination) {
    const wrap = document.getElementById('paginationButtons');
    if (!wrap || !pagination) return;
    wrap.innerHTML = '';
    const { current_page: page, total_pages: totalPages } = pagination;
    if (totalPages <= 1) return;

    const prev = document.createElement('button');
    prev.type = 'button';
    prev.className =
        'px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50';
    prev.textContent = 'Previous';
    prev.disabled = page <= 1;
    prev.onclick = () => loadPatients(page - 1);

    const next = document.createElement('button');
    next.type = 'button';
    next.className =
        'px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50';
    next.textContent = 'Next';
    next.disabled = page >= totalPages;
    next.onclick = () => loadPatients(page + 1);

    wrap.appendChild(prev);
    wrap.appendChild(next);
}

function renderPatients(rows, pagination) {
    const tbody = document.getElementById('patientsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const start = pagination.total_items === 0 ? 0 : (pagination.current_page - 1) * pagination.per_page + 1;
    const end = Math.min(
        pagination.current_page * pagination.per_page,
        pagination.total_items
    );
    document.getElementById('showingStart').textContent = String(start);
    document.getElementById('showingEnd').textContent = String(end);
    document.getElementById('totalPatients').textContent = String(pagination.total_items);

    if (!rows.length) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="6" class="px-6 py-8 text-center text-slate-500">No patients found.</td>`;
        tbody.appendChild(tr);
        renderPagination(pagination);
        return;
    }

    rows.forEach((p) => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50';
        const st = p.status || '';
        const badge =
            st === 'resolved'
                ? 'bg-green-100 text-green-800'
                : st === 'incoming'
                  ? 'bg-blue-100 text-blue-800'
                  : st === 'arrived'
                    ? 'bg-violet-100 text-violet-800'
                    : 'bg-amber-100 text-amber-800';
        const reasonShort = (p.reason || '').length > 120 ? `${(p.reason || '').slice(0, 120)}…` : (p.reason || '—');
        const linkedIncidentId = p.linked_incident_id || '';
        const linkedIncident = linkedIncidentId
            ? `<button type="button" data-incident-id="${escapeHtml(linkedIncidentId)}" class="open-linked-incident-btn text-left text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                    Incident ${escapeHtml(linkedIncidentId)}
                </button>
                <p class="text-xs text-slate-500">${escapeHtml(p.linked_incident_type || 'Incident')}</p>`
            : '<span class="text-sm text-slate-400">Manual patient</span>';
        const actions =
            st === 'incoming'
                ? `<button type="button" data-pid="${escapeHtml(p.patient_id)}" class="arrived-patient-btn px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Arrived?</button>`
                : st === 'arrived' || st === 'ongoing'
                  ? `<button type="button" data-pid="${escapeHtml(p.patient_id)}" class="resolve-patient-btn px-3 py-1 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Resolve</button>`
                  : '<span class="text-xs text-slate-400">—</span>';

        tr.innerHTML = `
            <td class="px-6 py-4">
                <p class="text-sm font-medium text-slate-900">${escapeHtml(p.full_name || '—')}</p>
                <p class="text-xs text-slate-500 font-mono">${escapeHtml(p.patient_id || '')}</p>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600 max-w-md">${escapeHtml(reasonShort)}</td>
            <td class="px-6 py-4">${linkedIncident}</td>
            <td class="px-6 py-4"><span class="px-2.5 py-0.5 text-xs font-medium rounded-full ${badge}">${escapeHtml(st)}</span></td>
            <td class="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">${formatDate(p.created_at)}</td>
            <td class="px-6 py-4">${actions}</td>`;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.arrived-patient-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-pid');
            if (id) markPatientArrived(id);
        });
    });
    tbody.querySelectorAll('.resolve-patient-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-pid');
            if (id) resolvePatient(id);
        });
    });
    tbody.querySelectorAll('.open-linked-incident-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-incident-id');
            if (id) {
                window.location.href = `reports.html?search=${encodeURIComponent(id)}&incident_id=${encodeURIComponent(id)}`;
            }
        });
    });

    renderPagination(pagination);
}

async function loadPatients(page = 1) {
    currentPage = page;
    showLoading();
    try {
        const params = new URLSearchParams({
            page: String(page),
            limit: String(pageLimit),
        });
        if (activeFilters.status) params.append('status', activeFilters.status);
        if (activeFilters.search) params.append('search', activeFilters.search);

        const response = await fetch(`${API_BASE_URL}/agency/patients?${params}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        if (!data.success) {
            throw new Error(data.error || 'Failed to load patients');
        }

        renderPatients(data.data || [], data.pagination || {});
        showContent();
    } catch (e) {
        console.error(e);
        showError(e.message || 'Failed to load patients');
    }
}

function applyPatientFilters() {
    activeFilters.status = (document.getElementById('statusFilter')?.value || '').trim();
    activeFilters.search = (document.getElementById('searchInput')?.value || '').trim();
    loadPatients(1);
}

async function markPatientArrived(patientId) {
    const r = await Swal.fire({
        title: 'Mark as arrived?',
        text: 'Confirm the patient has reached your facility.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, arrived',
    });
    if (!r.isConfirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/agency/patients`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ patient_id: patientId, status: 'arrived' }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        if (!data.success) {
            throw new Error(data.error || 'Update failed');
        }
        Swal.fire({ icon: 'success', title: 'Marked arrived', timer: 1600, showConfirmButton: false });
        loadPatients(currentPage);
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Could not update' });
    }
}

async function resolvePatient(patientId) {
    const r = await Swal.fire({
        title: 'Mark resolved?',
        text: 'This updates the patient status to resolved.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, resolve',
    });
    if (!r.isConfirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/agency/patients`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ patient_id: patientId, status: 'resolved' }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || `HTTP ${response.status}`);
        }
        if (!data.success) {
            throw new Error(data.error || 'Update failed');
        }
        Swal.fire({ icon: 'success', title: 'Resolved', timer: 1600, showConfirmButton: false });
        loadPatients(currentPage);
    } catch (e) {
        Swal.fire({ icon: 'error', title: 'Error', text: e.message || 'Could not update' });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        loadUserBar();
    } catch (_) {
        window.location.href = '../index.html';
        return;
    }
    loadPatients(1);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter') applyPatientFilters();
        });
    }
});

window.loadPatients = loadPatients;
window.applyPatientFilters = applyPatientFilters;
window.resolvePatient = resolvePatient;
window.markPatientArrived = markPatientArrived;
