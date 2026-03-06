"use client"

import { useState, useCallback } from "react"
import { Plus, Search, Mail, Trash2 } from "lucide-react"
import { ContentArea } from "@/components/layout/content-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarGroup } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { Modal } from "@/components/ui/modal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

// =============================================================================
// Sample data
// =============================================================================

const PEOPLE = [
  { name: "Sophia Morales", color: "#6366F1" },
  { name: "Jane Park" },
  { name: "Mike Torres" },
  { name: "Alex Chen", color: "#10B981" },
  { name: "Sam Wilson" },
  { name: "Jordan Lee" },
]

const ROLES = [
  { value: "director", label: "Director" },
  { value: "producer", label: "Producer" },
  { value: "dp", label: "DP" },
  { value: "gaffer", label: "Gaffer" },
  { value: "sound", label: "Sound Mixer" },
  { value: "pa", label: "PA" },
]

const PRODUCTION_TYPES = [
  { value: "film", label: "Film" },
  { value: "short", label: "Short" },
  { value: "commercial", label: "Commercial" },
  { value: "music_video", label: "Music Video" },
  { value: "tv_episodic", label: "TV / Episodic" },
  { value: "other", label: "Other" },
]

// =============================================================================
// Page
// =============================================================================

export default function ComponentsDevPage() {
  const [logline, setLogline] = useState("")
  const [prodType, setProdType] = useState("")
  const [errorSelect, setErrorSelect] = useState("")
  const [weather, setWeather] = useState(true)
  const [notify, setNotify] = useState(true)
  const [disabledToggle, setDisabledToggle] = useState(false)

  // Overlay state
  const [modalOpen, setModalOpen] = useState(false)
  const [narrowModalOpen, setNarrowModalOpen] = useState(false)
  const [modalRole, setModalRole] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)

  const handleDelete = useCallback(() => {
    setDeleteLoading(true)
    setTimeout(() => {
      setDeleteLoading(false)
      setDeleteOpen(false)
    }, 1500)
  }, [])


  return (
    <ContentArea className="max-w-[900px]">
      <h1 style={{ fontSize: 20, fontWeight: 600 }} className="mb-8">
        Component Library
      </h1>

      {/* ================================================================= */}
      {/* Buttons */}
      {/* ================================================================= */}
      <Section title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Button isLoading loadingText="Publishing...">
            Publish
          </Button>
          <Button leftIcon={Plus}>New Production</Button>
          <Button variant="danger" leftIcon={Trash2} size="sm">
            Delete
          </Button>
          <Button variant="ghost" leftIcon={Mail} />
        </div>
      </Section>

      {/* ================================================================= */}
      {/* Badges */}
      {/* ================================================================= */}
      <Section title="Badge">
        <p className="text-[12px] text-[#71717A] mb-2">Production status</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge type="status" value="development" />
          <Badge type="status" value="pre_production" />
          <Badge type="status" value="production" />
          <Badge type="status" value="post_production" />
          <Badge type="status" value="wrapped" />
        </div>
        <p className="text-[12px] text-[#71717A] mb-2 mt-4">Priority</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge type="priority" value="urgent" />
          <Badge type="priority" value="high" />
          <Badge type="priority" value="medium" />
          <Badge type="priority" value="low" />
        </div>
        <p className="text-[12px] text-[#71717A] mb-2 mt-4">
          Call sheet status
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge type="call-sheet" value="draft" />
          <Badge type="call-sheet" value="published" />
          <Badge type="call-sheet" value="live" />
          <Badge type="call-sheet" value="wrapped" />
        </div>
        <p className="text-[12px] text-[#71717A] mb-2 mt-4">Confirmation</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge type="confirmation" value="confirmed" />
          <Badge type="confirmation" value="viewed" />
          <Badge type="confirmation" value="pending" />
        </div>
      </Section>

      {/* ================================================================= */}
      {/* Avatars */}
      {/* ================================================================= */}
      <Section title="Avatar">
        <div className="flex items-center gap-4">
          <Avatar name="Sophia Morales" size="sm" />
          <Avatar name="Jane Park" size="md" />
          <Avatar name="Mike Torres" size="lg" />
          <Avatar name="Alex Chen" size="lg" color="#10B981" />
        </div>
        <p className="text-[12px] text-[#71717A] mb-2 mt-4">Avatar Group</p>
        <AvatarGroup people={PEOPLE} max={4} />
      </Section>

      {/* ================================================================= */}
      {/* Inputs */}
      {/* ================================================================= */}
      <Section title="Input">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Production Name"
            placeholder="Enter production name"
            helperText="This will be visible to your crew"
          />
          <Input
            label="Production Name"
            placeholder="Enter production name"
            error="Name is required"
            defaultValue=""
          />
          <Input
            label="Search"
            placeholder="Search productions..."
            leftIcon={Search}
          />
          <Input
            label="Disabled Input"
            placeholder="Can't type here"
            disabled
            value="Read-only value"
          />
        </div>
      </Section>

      {/* ================================================================= */}
      {/* Textareas */}
      {/* ================================================================= */}
      <Section title="Textarea">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label="Logline"
            placeholder="Describe your production in one sentence"
            maxLength={200}
            value={logline}
            onChange={(e) => setLogline(e.target.value)}
            helperText="Keep it concise"
          />
          <Textarea
            label="Notes"
            placeholder="Additional notes..."
            error="Notes cannot be empty"
          />
        </div>
      </Section>

      {/* ================================================================= */}
      {/* Selects */}
      {/* ================================================================= */}
      <Section title="Select">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Production Type"
            placeholder="Choose a type..."
            options={PRODUCTION_TYPES}
            value={prodType}
            onChange={(e) => setProdType(e.target.value)}
            helperText="Select the format of your production"
          />
          <Select
            label="Category"
            placeholder="Choose a category..."
            options={PRODUCTION_TYPES}
            value={errorSelect}
            onChange={(e) => setErrorSelect(e.target.value)}
            error="Category is required"
          />
        </div>
      </Section>

      {/* ================================================================= */}
      {/* Toggles */}
      {/* ================================================================= */}
      <Section title="Toggle">
        <div className="space-y-4 max-w-md">
          <Toggle
            label="Auto-fetch weather"
            description="Automatically pull forecast for the shoot day"
            checked={weather}
            onChange={setWeather}
          />
          <Toggle
            label="Notify crew of changes"
            checked={notify}
            onChange={setNotify}
          />
          <Toggle
            label="Disabled toggle"
            description="This setting is locked"
            checked={disabledToggle}
            onChange={setDisabledToggle}
            disabled
          />
        </div>
      </Section>

      {/* ================================================================= */}
      {/* Modal */}
      {/* ================================================================= */}
      <Section title="Modal">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button variant="secondary" onClick={() => setNarrowModalOpen(true)}>
            Open Narrow Modal
          </Button>
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Add Crew Member"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setModalOpen(false)}>Add</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Name" placeholder="Full name" />
            <Input label="Email" placeholder="email@example.com" />
            <Select
              label="Role"
              placeholder="Select a role..."
              options={ROLES}
              value={modalRole}
              onChange={(e) => setModalRole(e.target.value)}
            />
          </div>
        </Modal>

        <Modal
          isOpen={narrowModalOpen}
          onClose={() => setNarrowModalOpen(false)}
          title="Edit Call Time"
          size="narrow"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setNarrowModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => setNarrowModalOpen(false)}>
                Save
              </Button>
            </>
          }
        >
          <Input label="Call Time" placeholder="6:00 AM" />
        </Modal>
      </Section>

      {/* ================================================================= */}
      {/* ConfirmDialog */}
      {/* ================================================================= */}
      <Section title="ConfirmDialog">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="danger"
            leftIcon={Trash2}
            onClick={() => setDeleteOpen(true)}
          >
            Delete Call Sheet
          </Button>
          <Button variant="secondary" onClick={() => setPublishOpen(true)}>
            Publish Call Sheet
          </Button>
        </div>

        <ConfirmDialog
          isOpen={deleteOpen}
          onClose={() => {
            setDeleteOpen(false)
            setDeleteLoading(false)
          }}
          onConfirm={handleDelete}
          title="Delete this call sheet?"
          description="This action is permanent. The call sheet and all associated data will be removed and cannot be recovered."
          confirmLabel="Delete Call Sheet"
          confirmVariant="danger"
          isLoading={deleteLoading}
        />

        <ConfirmDialog
          isOpen={publishOpen}
          onClose={() => setPublishOpen(false)}
          onConfirm={() => setPublishOpen(false)}
          title="Publish call sheet?"
          description="This will send notifications to all crew members with their call times and location details."
          confirmLabel="Publish"
          confirmVariant="primary"
        />
      </Section>
    </ContentArea>
  )
}

// =============================================================================
// Section wrapper
// =============================================================================

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-10">
      <h2
        style={{ fontSize: 16, fontWeight: 600 }}
        className="mb-4 pb-2 border-b border-[#E4E4E7]"
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
