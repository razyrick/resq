/**
 * Shared UI helpers for incident resolution proof + notes panels.
 */

function resolutionHelpersHasValidPhoto(photo) {
    if (photo === null || photo === undefined) return false;
    const s = String(photo).trim();
    return s !== '' && s !== 'null' && s !== 'undefined';
}

/** Treat common API status strings as resolved for the panel. */
function resolutionHelpersStatusIsResolved(status) {
    const s = String(status ?? '')
        .trim()
        .toLowerCase()
        .replace(/-/g, '')
        .replace(/\s+/g, '');
    return s === 'resolved' || s === 'complete' || s === 'closed';
}

/**
 * Populate a standard resolution details block (green panel).
 * @param {object} incident
 * @param {{ section: HTMLElement|null, meta: HTMLElement|null, notes: HTMLElement|null, emptyHint: HTMLElement|null, photoWrap: HTMLElement|null, proofImg: HTMLImageElement|null }} els
 * @param {{ formatResolvedAt?: (iso: string) => string }} [opts]
 */
function applyResolutionDetailPanel(incident, els, opts) {
    if (!els || !els.section) {
        return;
    }

    const formatResolvedAt =
        opts && typeof opts.formatResolvedAt === 'function'
            ? opts.formatResolvedAt
            : function (iso) {
                  if (!iso) return '';
                  const d = new Date(iso);
                  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString();
              };

    const hideAll = () => {
        els.section.classList.add('hidden');
        if (els.meta) {
            els.meta.textContent = '';
            els.meta.classList.add('hidden');
        }
        if (els.notes) {
            els.notes.textContent = '';
            els.notes.classList.add('hidden');
        }
        if (els.emptyHint) els.emptyHint.classList.add('hidden');
        if (els.photoWrap) els.photoWrap.classList.add('hidden');
        if (els.proofImg) {
            els.proofImg.removeAttribute('src');
        }
    };

    if (!incident || !resolutionHelpersStatusIsResolved(incident.status)) {
        hideAll();
        return;
    }

    els.section.classList.remove('hidden');

    const roleRaw = incident.resolved_by_role;
    const roleLabel =
        roleRaw === 'agency'
            ? 'Agency'
            : roleRaw === 'barangay'
              ? 'Barangay'
              : roleRaw
                ? String(roleRaw)
                : '';

    const resolvedAtStr = incident.resolved_at ? formatResolvedAt(incident.resolved_at) : '';

    const metaParts = [];
    if (roleLabel) metaParts.push(`Resolved by: ${roleLabel}`);
    if (resolvedAtStr && resolvedAtStr !== 'N/A') metaParts.push(`Completed: ${resolvedAtStr}`);

    if (els.meta) {
        if (metaParts.length > 0) {
            els.meta.textContent = metaParts.join(' · ');
            els.meta.classList.remove('hidden');
        } else {
            els.meta.textContent = '';
            els.meta.classList.add('hidden');
        }
    }

    const notesTrimmed =
        incident.resolution_notes && String(incident.resolution_notes).trim()
            ? String(incident.resolution_notes).trim()
            : '';

    if (els.notes) {
        if (notesTrimmed) {
            els.notes.textContent = notesTrimmed;
            els.notes.classList.remove('hidden');
        } else {
            els.notes.textContent = '';
            els.notes.classList.add('hidden');
        }
    }

    const proofUrl = resolutionHelpersHasValidPhoto(incident.resolution_photo)
        ? String(incident.resolution_photo).trim()
        : '';

    if (els.proofImg && els.photoWrap) {
        if (proofUrl) {
            els.proofImg.src = proofUrl;
            els.photoWrap.classList.remove('hidden');
            els.proofImg.onerror = function () {
                els.photoWrap.classList.add('hidden');
                els.proofImg.removeAttribute('src');
            };
        } else {
            els.photoWrap.classList.add('hidden');
            els.proofImg.removeAttribute('src');
        }
    }

    const hasAnyDetail = metaParts.length > 0 || notesTrimmed || proofUrl;
    if (els.emptyHint) {
        if (hasAnyDetail) {
            els.emptyHint.classList.add('hidden');
        } else {
            els.emptyHint.classList.remove('hidden');
        }
    }
}
