import { test } from "node:test";
import assert from "node:assert/strict";
import { consultationSchema, statusSchema, statuses } from "../lib/validation.ts";

const valid = {
 name: "Test Person", email: "PERSON@example.test", phone: "+1 (555) 010-0100",
 service: "Architecture", location: "Test city", budget: "To be discussed",
 message: "A test brief long enough for validation.", consent: true, website: "",
};
test("normalizes contact input without removing the brief", () => {
 const result=consultationSchema.parse({...valid,name:"  Test Person  ",message:`  ${valid.message}  `});
 assert.equal(result.email,"person@example.test");
 assert.equal(result.name,"Test Person");
 assert.equal(result.message,valid.message);
});
test("rejects absent consent, honeypot submissions and malformed email",()=>{
 for (const patch of [{consent:false},{consent:undefined},{website:"spam"},{email:"not-an-email"}]) {
  assert.equal(consultationSchema.safeParse({...valid,...patch}).success,false);
 }
});
test("rejects client attempts to assign ownership, roles, or pipeline status",()=>{
 for (const patch of [{customer_id:"someone-else"},{role:"admin"},{status:"won"},{consent_at:"2000-01-01"}]) {
  assert.equal(consultationSchema.safeParse({...valid,...patch}).success,false);
 }
});
test("enforces bounded fields and rejects invalid service and budget",()=>{
 for (const patch of [{name:"x"},{name:"x".repeat(101)},{message:"short"},{message:"x".repeat(4001)},{location:" "},{phone:"<script>"},{service:"Other"},{budget:"free"}]) {
  assert.equal(consultationSchema.safeParse({...valid,...patch}).success,false);
 }
});
test("accepts optional phone and honeypot defaults",()=>{
 const {phone,website,...input}=valid;
 assert.equal(consultationSchema.parse(input).phone,"");
 assert.equal(consultationSchema.parse(input).website,"");
});
test("requires a record UUID and the previous stage for concurrent updates",()=>{
 const id="49a53143-edb6-4901-8d88-e91452deaece";
 for (const status of statuses) assert.equal(statusSchema.safeParse({id,status,previousStatus:"new"}).success,true);
 for (const input of [{id:"bad",status:"won",previousStatus:"new"},{id,status:"unknown",previousStatus:"new"},{id,status:"won"}]) {
  assert.equal(statusSchema.safeParse(input).success,false);
 }
});
