"use client";
import type { Activity } from "@/lib/types";
import { request } from "@/lib/client-api";
import { MutationForm } from "./mutations";
export function CatalogueEditor({ activity: a }: { activity: Activity }) {
  return (
    <div className="stack">
      <MutationForm
        label="Save activity details"
        submit={(data) =>
          request(`/activities/${a.id}`, "PUT", {
            title: data.get("title"),
            description: data.get("description"),
            category: data.get("category"),
            area: data.get("area"),
            minAge: Number(data.get("minAge")),
            maxAge: Number(data.get("maxAge")),
            priceFils: Math.round(Number(data.get("price")) * 100),
            policy: data.get("policy"),
          })
        }
      >
        <div className="form-grid">
          <label className="wide">
            Title
            <input
              name="title"
              defaultValue={a.title}
              required
              maxLength={200}
            />
          </label>
          <label className="wide">
            Description
            <textarea
              name="description"
              defaultValue={a.description}
              minLength={10}
              maxLength={8000}
              required
            />
          </label>
          <label>
            Category
            <input
              name="category"
              defaultValue={a.category}
              maxLength={200}
              required
            />
          </label>
          <label>
            Area
            <input name="area" defaultValue={a.area} maxLength={200} required />
          </label>
          <label>
            Minimum age
            <input
              name="minAge"
              type="number"
              min={0}
              max={18}
              defaultValue={a.min_age}
              required
            />
          </label>
          <label>
            Maximum age
            <input
              name="maxAge"
              type="number"
              min={0}
              max={18}
              defaultValue={a.max_age}
              required
            />
          </label>
          <label>
            Price per child (AED)
            <input
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              max={100000}
              defaultValue={a.price_fils / 100}
              required
            />
          </label>
          <label className="wide">
            Policy
            <textarea
              name="policy"
              defaultValue={a.policy}
              minLength={10}
              maxLength={8000}
              required
            />
          </label>
        </div>
        <p className="fine-print">
          Existing booking prices and accepted policies remain in their original
          snapshots.
        </p>
      </MutationForm>
      <details>
        <summary>Add a session</summary>
        <MutationForm
          label="Add session"
          reset
          submit={(data) =>
            request(`/activities/${a.id}/sessions`, "POST", {
              startsAt: new Date(
                String(data.get("startsAt")) + "+04:00",
              ).toISOString(),
              cutoffAt: new Date(
                String(data.get("cutoffAt")) + "+04:00",
              ).toISOString(),
              capacity: Number(data.get("capacity")),
            })
          }
        >
          <label>
            Session starts (Dubai time)
            <input name="startsAt" type="datetime-local" required />
          </label>
          <label>
            Request cutoff (Dubai time)
            <input name="cutoffAt" type="datetime-local" required />
          </label>
          <label>
            Capacity
            <input name="capacity" type="number" min={1} max={10000} required />
          </label>
        </MutationForm>
      </details>
    </div>
  );
}
export function CorrectionReview({ id }: { id: string }) {
  return (
    <MutationForm
      label="Save correction review"
      submit={(data) =>
        request(`/admin/corrections/${id}/review`, "POST", {
          status: data.get("status"),
          reason: data.get("reason"),
        })
      }
    >
      <label>
        Decision
        <select name="status">
          <option value="resolved">Resolved — catalogue updated</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>
      <label>
        Review note
        <textarea name="reason" minLength={1} maxLength={2000} required />
      </label>
      <p className="fine-print">
        Update the activity in Catalogue before marking its correction resolved.
      </p>
    </MutationForm>
  );
}
