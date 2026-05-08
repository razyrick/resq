/**
 * Mirrors backend Barangay::DISPATCHER_ESCALATION_PLACEHOLDER_ID — generic dispatcher-queue handoff.
 */
const BARANGAY_DISPATCHER_ESCALATION_PLACEHOLDER_ID = '1';

function dispatcherIdNormalizedFromIncident(incident) {
    if (!incident || incident.dispatcher_id == null || incident.dispatcher_id === '') {
        return '';
    }
    const s = String(incident.dispatcher_id).trim();
    const lowered = s.toLowerCase();
    if (lowered === 'null' || lowered === 'undefined') {
        return '';
    }
    return s;
}

function incidentAssignIdIsUnset(incident) {
    if (!incident) {
        return true;
    }
    const a = incident.assign_id;
    if (a == null) {
        return true;
    }
    const t = String(a).trim().toLowerCase();
    return t === '' || t === '0' || t === 'null' || t === 'undefined';
}

/** Timed-out or manual generic escalate: barangay can still claim (Accept) to own the case locally. */
function incidentIsClaimableTimedDispatcherEscalation(incident) {
    const d = dispatcherIdNormalizedFromIncident(incident);
    if (d !== BARANGAY_DISPATCHER_ESCALATION_PLACEHOLDER_ID) {
        return false;
    }
    return incidentAssignIdIsUnset(incident);
}

/** Barangay UI should defer to dispatcher workflow (hide accept/resolve/escalate) when a non-placeholder dispatcher is assigned. */
function incidentBarangayActionsLockedByDispatcher(incident) {
    const d = dispatcherIdNormalizedFromIncident(incident);
    if (!d) {
        return false;
    }
    if (incidentIsClaimableTimedDispatcherEscalation(incident)) {
        return false;
    }
    return true;
}
