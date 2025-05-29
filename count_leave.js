(function () {
    'use strict';

    const events = [
        "app.record.create.show",
        "app.record.edit.show",
        "app.record.detail.show",
        "app.record.detail.process.proceed",
    ];

    kintone.events.on(events, async function (event) {
        const leaveDays = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
            app: 20
        });

        console.log('Records:', leaveDays.records);

        console.log('leave days:', leaveDays.leaveDays);

        const record = event.record;

        if (event.action.value !== "Approved") return event;

        const totalDays = Number(record.total_days.value);
        let leaveDaysRemaining = Number(record.leave_days.value);

        // Calculate new leave balance
        const newLeaveBalance = leaveDaysRemaining - totalDays;

        // Update the field (this only works if leave_days is editable)
        record.leave_days.value = newLeaveBalance;

        console.log(`Approved leave for ${totalDays} days. New leave balance: ${newLeaveBalance}`);

        return event;
    });
})();
