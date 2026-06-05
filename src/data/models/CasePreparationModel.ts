// @ts-nocheck — many legacy API field assignments; strict instance typing deferred.
export class CasePreparationModel {
  constructor(formData, batchId, username) {
    this.batchId = batchId;
    this.casePrepStatus = "DRAFT";

    /* ================= STEP 1 ================= */

    // Inspect surface
    this.op1a = formData.inspectSurfaceActor;
    this.t1p1a = formData.inspectSurface;     // dropdown OK/NOT OK
    this.t1p1b = formData.inspectSurface;     // legacy expects repeat
    this.t1p1c = formData.inspectSurface;     // legacy expects repeat

    // Abrading
    this.op2a = formData.abradingActor;
    this.t1p2a = formData.abradedDustQty;

    // Inspect abrading
    this.op3a = formData.inspectAbradingActor;
    this.t1p3a = formData.inspectAbrading;    // dropdown

    // Bellow preparation
    this.op4a = formData.bellowActor;
    this.t1p4a = formData.bellowStatus;       // dropdown

    // Surface cleaning
    this.op5a = formData.surfaceCleaningActor;
    this.t1p5a = formData.surfaceCleaning;    // dropdown

    // Preheating
    this.op6a = formData.preheatActor;
    this.t1p2b = formData.preheatTemp;
    this.t1p2c = formData.preheatDuration;

    /* ================= STEP 2 ================= */

    // Inspection motors
    this.op6b = formData.inspectionActor;
    this.mcidStatus1 = formData.inspectionMotor1;  // dropdown
    this.mcidStatus2 = formData.inspectionMotor2;  // dropdown

    // Insulation temp
    this.op6c = formData.insulationActor;
    this.t1p3b = formData.insulationTemp1;
    this.t1p3c = formData.insulationTemp2;

    // Liner batch
    this.t1p4b = formData.linerBatch1;
    this.t1p4c = formData.linerBatch2;

    // Coating
    this.t1p5b = formData.coatingDuration;
    this.t1p5c = formData.coatingQuantity;

    // Visual inspection motors
    this.mcidStatus3 = formData.visualMotor1; // dropdown
    this.mcidStatus4 = formData.visualMotor2; // dropdown
    this.mcidStatus5 = formData.visualMotor2; // backend expects 5th status

    this.username = username;
  }
}