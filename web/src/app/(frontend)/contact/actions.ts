'use server'

import { prisma } from '@/lib/prisma'

export type EnquiryResult = { ok: boolean; error?: string }

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const clip = (s: unknown, max: number) => String(s ?? '').trim().slice(0, max)

/**
 * Handle a contact-form submission. Runs as a Next Server Action, so it's a
 * same-origin POST (CSRF-protected by the framework's action origin check). The
 * enquiry is validated and persisted; nothing is silently dropped, and the form
 * only shows success when this resolves ok.
 */
export async function submitEnquiry(input: {
  enquiry?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  company?: string
  message?: string
}): Promise<EnquiryResult> {
  const firstName = clip(input.firstName, 120)
  const lastName = clip(input.lastName, 120)
  const email = clip(input.email, 200).toLowerCase()
  const message = clip(input.message, 5000)

  if (!firstName) return { ok: false, error: 'Please enter your first name.' }
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email address.' }
  if (!message) return { ok: false, error: 'Please enter a message.' }

  try {
    await prisma.enquiry.create({
      data: {
        enquiry: clip(input.enquiry, 120),
        firstName,
        lastName,
        email,
        phone: clip(input.phone, 60),
        company: clip(input.company, 200),
        message,
      },
    })
  } catch (e) {
    console.error('[contact] failed to save enquiry', e)
    return { ok: false, error: 'Something went wrong sending your message. Please try again, or email us directly.' }
  }
  return { ok: true }
}
