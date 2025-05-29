(function () {
    'use strict';
    
    const events = [
        "app.record.create.show",
        "app.record.edit.show",
        "app.record.detail.show",
        "app.record.detail.process.proceed",
    ];
    
    kintone.events.on(events, async function (event) {
        try {
            const statusField = event.record.status || event.record.Status;
            
            if (!statusField) {
                console.log('Status field not found. Available fields:', Object.keys(event.record));
                return event;
            }
            
            const currentStatus = statusField.value;

            if (currentStatus === 'approved' || currentStatus === 'Approved') {
                const leaveDays = await kintone.api(kintone.api.url('/k/v1/records', true), 'GET', {
                    app: 20
                });
                
                // Check if records exist
                if (!leaveDays.records || leaveDays.records.length === 0) {
                    console.log('No records found in app 20');
                    return event;
                }
                
                // Safely get values with error checking
                const firstRecord = leaveDays.records[0];
                
                if (!firstRecord.total_days || !firstRecord.leave_days) {
                    console.log('Required fields not found. Available fields:', Object.keys(firstRecord));
                    return event;
                }
                
                const totalDays = Number(firstRecord.total_days.value) || 0;
                const leaveDaysRemaining = Number(firstRecord.leave_days.value) || 0;
                
                console.log('Total Days:', totalDays);
                console.log('Leave Days Remaining:', leaveDaysRemaining);
                
                // Calculate new leave balance
                const newLeaveBalance = leaveDaysRemaining - totalDays;
                
                console.log(`Approved leave for ${totalDays} days. New leave balance: ${newLeaveBalance}`);
                
                try {
                    // Get the correct record ID for app 18
                    let recordId;
                    
                    // Try different methods to get record ID
                    if (event.recordId) {
                        recordId = event.recordId;
                    } else if (event.record && event.record.$id) {
                        recordId = event.record.$id.value;
                    } else {
                        // Try to get from kintone app record
                        recordId = kintone.app.record.getId();
                    }
                    
                    console.log('Using record ID for app 18:', recordId);
                    
                    if (recordId) {
                        const updateResponse = await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
                            app: 18,
                            id: recordId,
                            record: {
                                leave_days: {
                                    value: newLeaveBalance
                                }
                            }
                        });
                        
                        console.log('Successfully updated app 18:', updateResponse);
                    } else {
                        console.log('Could not determine record ID for app 18');
                    }
                    
                    // Also update the leave days remaining in app 20
                    if (firstRecord.$id && firstRecord.$id.value) {
                        const updateApp20Response = await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', {
                            app: 20,
                            id: firstRecord.$id.value,
                            record: {
                                leave_days: {
                                    value: newLeaveBalance
                                }
                            }
                        });
                        
                        console.log('Successfully updated app 20:', updateApp20Response);
                    } else {
                        console.log('Could not determine record ID for app 20');
                    }
                    
                } catch (updateError) {
                    console.error('Error updating records:', updateError);
                    console.error('Update error details:', {
                        message: updateError.message,
                        code: updateError.code,
                        errors: updateError.errors
                    });
                }
                
            } else {
                console.log('Status is not approved. Calculation skipped.');
            }
        } catch (error) {
            console.error('Error in leave calculation:', error);
        }
        
        return event;
    });
})();