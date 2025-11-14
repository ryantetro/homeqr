'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

interface ListingActionsProps {
  listingId: string;
  currentStatus: string;
  onStatusChange?: () => void;
}

export default function ListingActions({
  listingId,
  currentStatus,
  onStatusChange,
}: ListingActionsProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isReactivateModalOpen, setIsReactivateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/listings?id=${listingId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete listing');
      }

      // Redirect to listings page
      router.push('/dashboard/listings');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete listing');
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/listings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: listingId,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update listing status');
      }

      // Close modal and reset all states
      setIsDeactivateModalOpen(false);
      setIsReactivateModalOpen(false);
      setIsMenuOpen(false);
      setIsLoading(false);
      
      if (onStatusChange) {
        onStatusChange();
      }
      
      // Refresh the page data
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing status');
      setIsLoading(false);
    }
  };

  // Close menu when clicking outside or when modals open
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Close menu when modals open
  useEffect(() => {
    if (isDeleteModalOpen || isDeactivateModalOpen || isReactivateModalOpen) {
      setIsMenuOpen(false);
    }
  }, [isDeleteModalOpen, isDeactivateModalOpen, isReactivateModalOpen]);

  const isActive = currentStatus === 'active';
  const isInactive = currentStatus === 'inactive';
  const isDeleted = currentStatus === 'deleted';

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!isLoading) {
              setIsMenuOpen(!isMenuOpen);
            }
          }}
          disabled={isLoading}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Listing actions"
          type="button"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-white shadow-lg border border-gray-200 py-1 z-50">
            {isActive && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsDeactivateModalOpen(true);
                }}
                disabled={isLoading}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Deactivate</span>
              </button>
            )}
            {(isInactive || isDeleted) && (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsReactivateModalOpen(true);
                }}
                disabled={isLoading}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Reactivate</span>
              </button>
            )}
            <div className="my-1 border-t border-gray-200" />
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsDeleteModalOpen(true);
              }}
              disabled={isLoading}
              className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setError(null);
        }}
        title="Delete Listing"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setError(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? 'Deleting...' : 'Delete Listing'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this listing? This action cannot be undone.
            The listing will be permanently removed from your account.
          </p>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </Modal>

      {/* Deactivate Confirmation Modal */}
      <Modal
        isOpen={isDeactivateModalOpen}
        onClose={() => {
          setIsDeactivateModalOpen(false);
          setError(null);
        }}
        title="Deactivate Listing"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeactivateModalOpen(false);
                setError(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleStatusChange('inactive')}
              disabled={isLoading}
            >
              {isLoading ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to deactivate this listing? It will be hidden from public view
            but can be reactivated later.
          </p>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </Modal>

      {/* Reactivate Confirmation Modal */}
      <Modal
        isOpen={isReactivateModalOpen}
        onClose={() => {
          setIsReactivateModalOpen(false);
          setError(null);
        }}
        title="Reactivate Listing"
        size="md"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setIsReactivateModalOpen(false);
                setError(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => handleStatusChange('active')}
              disabled={isLoading}
            >
              {isLoading ? 'Reactivating...' : 'Reactivate'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to reactivate this listing? It will be visible to the public again.
          </p>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

