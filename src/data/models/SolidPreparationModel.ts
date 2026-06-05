// @ts-nocheck — dynamic Object.assign from form; strict instance typing deferred.
export class SolidPrepModel {
  constructor(form, batchId, username) {
    this.solidPrepstatus = "DRAFT";
    this.batchId = batchId;

    /* Spread all form values */
    Object.assign(this, form);

    /* Ensure legacy fields always exist */
    this.motorBatchNo = form.motorBatchNo || "";
    this.grindingBatchId = form.grindingBatchId || "";
    this.psdDate = form.psdDate || "";
    this.foreignParticleActor = form.foreignParticleActor || "";

    this.username = username;
  }
}