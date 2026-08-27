import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Building2, Mail, Phone, MessageSquare } from 'lucide-react';
import type { LeadCreatePayload, LeadWithLatestQualification } from '../types';
import { useLeads } from '../context/LeadContext';

interface LeadModalProps {
  isOpen: boolean;
  leadToEdit?: LeadWithLatestQualification | null;
  onClose: () => void;
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  leadToEdit,
  onClose,
}) => {
  const { createLead, updateLead } = useLeads();
  const [formData, setFormData] = useState<LeadCreatePayload>({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (leadToEdit) {
      setFormData({
        name: leadToEdit.name || '',
        email: leadToEdit.email || '',
        phone: leadToEdit.phone || '',
        company: leadToEdit.company || '',
        message: leadToEdit.message || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
      });
    }
    setErrorMessage(null);
  }, [leadToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMessage('Lead name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (leadToEdit) {
        await updateLead(leadToEdit.id, formData);
      } else {
        await createLead(formData);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save lead record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">
              {leadToEdit ? 'Edit Intelligence Record' : 'Register New Lead'}
            </h2>
            <span className="modal-subtitle">
              {leadToEdit
                ? `Updating lead profile ID #${leadToEdit.id}`
                : 'Ingest prospect for autonomous AI qualification'}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMessage && (
              <div className="alert-banner alert-error">
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Name */}
            <div className="form-group">
              <label className="form-label">Prospect Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Jane Prospect"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            {/* Company & Email in Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">
                  <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Company Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Corporation"
                  value={formData.company || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Mail size={12} style={{ display: 'inline', marginRight: 4 }} />
                  Email Address
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. jane@acme.com"
                  value={formData.email || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="form-label">
                <Phone size={12} style={{ display: 'inline', marginRight: 4 }} />
                Phone Number
              </label>
              <input
                type="tel"
                className="form-input"
                placeholder="e.g. +1 (555) 019-2834"
                value={formData.phone || ''}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            {/* Inquiry / Message */}
            <div className="form-group">
              <label className="form-label">
                <MessageSquare size={12} style={{ display: 'inline', marginRight: 4 }} />
                Inquiry Message / Request Context
              </label>
              <textarea
                className="form-textarea"
                placeholder="Paste prospect notes, inquiry message, requirements, or conversation context here for AI scoring..."
                value={formData.message || ''}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="header-btn header-btn-ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="header-btn header-btn-gold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span>Saving Record...</span>
              ) : leadToEdit ? (
                <>
                  <Save size={15} />
                  <span>Update Lead</span>
                </>
              ) : (
                <>
                  <UserPlus size={15} />
                  <span>Create Lead</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
