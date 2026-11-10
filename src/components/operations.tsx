"use client";
import { useState } from "react";
import { request } from "@/lib/client-api";
import { MutationForm } from "./mutations";
export function AdminTools({ resource }: { resource: string }) {
  const [preview, setPreview] = useState<unknown>(null);
  if (resource === "campaigns")
    return (
      <details className="panel">
        <summary>Create a campaign draft</summary>
        <div className="section-gap">
          <MutationForm
            label="Save draft"
            reset
            submit={(data) =>
              request("/admin/campaigns", "POST", {
                name: data.get("name"),
                template: data.get("template"),
                language: data.get("language"),
              })
            }
          >
            <label>
              Campaign name
              <input name="name" maxLength={200} required />
            </label>
            <label>
              Approved template name
              <input name="template" maxLength={200} required />
            </label>
            <label>
              Language
              <input
                name="language"
                defaultValue="en"
                minLength={2}
                maxLength={20}
                required
              />
            </label>
            <p className="fine-print">Saving a draft sends no messages.</p>
          </MutationForm>
        </div>
      </details>
    );
  return (
    <details className="panel">
      <summary>Validate a small contact batch</summary>
      <div className="section-gap">
        <MutationForm
          label="Validate or import"
          submit={async (data) => {
            const rows = JSON.parse(String(data.get("rows")));
            const result = await request("/admin/contacts/import", "POST", {
              rows,
              source: data.get("source"),
              commit: data.get("commit") === "on",
            });
            setPreview(result);
            return result;
          }}
        >
          <label>
            Source
            <input name="source" maxLength={200} required />
          </label>
          <label>
            Fictional contacts (JSON)
            <textarea
              name="rows"
              maxLength={24000}
              placeholder={'[{"name":"Example","phone":"+971500000000"}]'}
              required
            />
          </label>
          <label className="check-row">
            <input name="commit" type="checkbox" />
            <span>Commit validated records</span>
          </label>
          <p className="fine-print">
            Up to 1,000 rows within the request size limit. Imported contacts
            have unknown permission and cannot receive messages.
          </p>
        </MutationForm>
        {preview !== null && (
          <pre className="notice wrap-id">
            {JSON.stringify(preview, null, 2)}
          </pre>
        )}
      </div>
    </details>
  );
}
export function RefundCompletion({ id }: { id: string }) {
  return (
    <MutationForm
      label="Record completed refund"
      submit={(data) =>
        request(`/admin/refunds/${id}/complete`, "POST", {
          reference: data.get("reference"),
        })
      }
    >
      <label>
        Verified refund evidence reference
        <input name="reference" minLength={5} maxLength={500} required />
      </label>
    </MutationForm>
  );
}
export function SuppressContact({ id }: { id: string }) {
  return (
    <MutationForm
      label="Suppress contact"
      submit={() => request(`/admin/contacts/${id}/suppress`, "POST", {})}
    >
      <p className="fine-print">
        Suppressing a contact blocks eligibility even if permission was
        previously verified.
      </p>
    </MutationForm>
  );
}
