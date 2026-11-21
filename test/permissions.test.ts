import test from "node:test";
import assert from "node:assert/strict";
import { canUseAdminPath, bookingControls, operationsResources, operatorHome } from "../src/lib/permissions";
import type { Identity } from "../src/lib/types";

const parent: Identity = {id:"synthetic",email:"synthetic@example.invalid",roles:["parent"],role:"parent",active:true};
const ordinaryAdmin: Identity = {...parent,role:"admin",roles:["parent","superadmin"]};
const finance: Identity = {...parent,capabilities:["bookings.read","payments.read","payments.verify","refunds.complete"]};
const support: Identity = {...parent,capabilities:["bookings.read","bookings.override","support.manage"]};
const content: Identity = {...parent,capabilities:["content.manage"]};

test("ordinary admins and parents do not inherit privileged workspace access",() => {
  for (const path of ["/admin/programs","/admin/content","/admin/bookings","/admin/bookings/synthetic","/admin/support","/admin/operations?resource=refunds","/admin/operations?resource=audit"])
    assert.equal(canUseAdminPath(ordinaryAdmin,path),false,path);
  assert.equal(canUseAdminPath(ordinaryAdmin,"/admin/partners"),true);
  assert.equal(canUseAdminPath(parent,"/admin"),false);
  assert.deepEqual(operationsResources(ordinaryAdmin),["contacts","campaigns"]);
  assert.equal(bookingControls(ordinaryAdmin,"admin").verify,false);
  assert.equal(bookingControls(ordinaryAdmin,"admin").respond,false);
});

test("delegated operators enter only their capability workspaces without an admin role",() => {
  assert.equal(operatorHome(finance),"/admin/bookings");
  assert.equal(operatorHome(content),"/admin/programs");
  assert.equal(canUseAdminPath(finance,"/admin/bookings/synthetic"),true);
  assert.equal(canUseAdminPath(finance,"/admin/programs"),false);
  assert.equal(canUseAdminPath(finance,"/admin/operations?resource=refunds"),true);
  assert.equal(canUseAdminPath(finance,"/admin/operations?resource=contacts"),false);
  assert.equal(canUseAdminPath(content,"/admin/content"),true);
  assert.equal(canUseAdminPath(content,"/admin/operations?resource=corrections"),true);
  assert.equal(canUseAdminPath(support,"/admin/support"),true);
  assert.equal(canUseAdminPath(support,"/admin/operations?resource=refunds"),false);
  for (const actor of [finance,support,content]) {
    assert.equal(canUseAdminPath(actor,"/admin/notifications"),true);
    assert.equal(canUseAdminPath(actor,"/admin/partners"),false);
  }
});

test("finance and support controls remain separate and finance requires step-up",() => {
  assert.deepEqual(bookingControls(finance,"admin"),{respond:false,override:false,verify:true,steppedUp:false});
  assert.equal(bookingControls({...finance,assuranceLevel:"aal2"},"admin").steppedUp,true);
  assert.deepEqual(bookingControls(support,"admin"),{respond:true,override:true,verify:false,steppedUp:false});
  assert.equal(bookingControls(finance,"parent").verify,false);
  assert.equal(bookingControls({...parent,roles:["parent","partner"]},"partner").verify,false);
  assert.equal(canUseAdminPath({...finance,capabilities:[]},"/admin/bookings"),false);
});
