import { ref, get, update, push } from 'firebase/database';
import { getDatabase } from 'firebase/database';
import { app } from '../firebase/firebaseConfig';
import { auth } from '../firebase/auth';

const database = getDatabase(app);

export const directRepresentativeService = {
  // Get all Direct Representative requests
  async getDirectRepresentativeRequests() {
    try {
      const snapshot = await get(ref(database, 'drreqs'));

      if (!snapshot.exists()) {
        return [];
      }

      const requests = [];
      snapshot.forEach((child) => {
        const data = child.val();
        requests.push({
          id: child.key,
          ...data,
          requestType: 'direct_representative',
          items: data.items || {},
          priority: data.priority || 'normal',
          requestedByRole: data.requestedByRole || 'DirectRepresentative'
        });
      });

      return requests;
    } catch (error) {
      console.error('Error fetching Direct Representative requests:', error);
      throw new Error(`Failed to fetch Direct Representative requests: ${error.message}`);
    }
  },

  // Approve Direct Representative request
  async approveRequest(requestId, approverData) {
    try {
      const currentUser = auth.currentUser;

      // Get the request data first
      const requestSnapshot = await get(ref(database, `drreqs/${requestId}`));
      if (!requestSnapshot.exists()) {
        throw new Error('Request not found');
      }

      const requestData = requestSnapshot.val();

      console.log('Direct Representative Approval - Request ID:', requestId);
      console.log('Direct Representative Approval - Request Data:', JSON.stringify(requestData, null, 2));
      console.log('Direct Representative Approval - Items:', JSON.stringify(requestData.items, null, 2));

      // Check if items exist - log all possible item field names
      console.log('Checking for items in request data...');
      console.log('requestData.items:', JSON.stringify(requestData.items, null, 2));
      console.log('requestData.products:', JSON.stringify(requestData.products, null, 2));
      console.log('requestData.product:', requestData.product);
      console.log('requestData.quantity:', requestData.quantity);
      console.log('All request data keys:', Object.keys(requestData));

      // Handle different possible structures for items
      let items = null;

      // Try to parse items if it's a string
      if (requestData.items) {
        if (typeof requestData.items === 'string') {
          try {
            items = JSON.parse(requestData.items);
            console.log('Parsed items from string:', JSON.stringify(items, null, 2));
          } catch (e) {
            console.log('Could not parse items string:', requestData.items);
            items = null;
          }
        } else if (typeof requestData.items === 'object') {
          items = requestData.items;
        }
      }

      // If no valid items field but has product/quantity, create items object
      if ((!items || Object.keys(items).length === 0) && requestData.product && requestData.quantity) {
        console.log('Converting product/quantity to items structure...');
        const qty = Number(requestData.quantity);
        console.log('requestData.quantity:', requestData.quantity, 'Converted to Number:', qty);
        items = {
          [requestData.product]: {
            name: requestData.product,
            qty: qty
          }
        };
        console.log('Created items:', JSON.stringify(items, null, 2));
      }

      // If still no items, check for products field
      if ((!items || Object.keys(items).length === 0) && requestData.products) {
        console.log('Using products field as items...');
        if (typeof requestData.products === 'string') {
          try {
            items = JSON.parse(requestData.products);
          } catch (e) {
            items = requestData.products;
          }
        } else {
          items = requestData.products;
        }
      }

      // Ensure items is an object and not empty
      if (!items || typeof items !== 'object' || Object.keys(items).length === 0) {
        console.error('ERROR: No items found in request after all checks!');
        console.error('Full request data:', JSON.stringify(requestData, null, 2));
        throw new Error('Cannot approve request: No items found in request');
      }

      console.log('Final items to be used:', JSON.stringify(items, null, 2));

      // Ensure all required fields are present
      const updates = {};
      updates[`/drreqs/${requestId}/status`] = 'Approved';
      updates[`/drreqs/${requestId}/updatedAt`] = Date.now();
      updates[`/drreqs/${requestId}/approvedAt`] = Date.now();
      updates[`/drreqs/${requestId}/approvedBy`] = approverData.approvedBy || currentUser?.uid || '';
      updates[`/drreqs/${requestId}/approverName`] = approverData.approverName || '';
      updates[`/drreqs/${requestId}/approverRole`] = approverData.approverRole || '';

      // Calculate total quantity with enhanced debugging
      let totalQuantity = 0;
      if (items && typeof items === 'object') {
        const itemsArray = Object.values(items);
        console.log('===== QUANTITY CALCULATION DEBUG =====');
        console.log('Items array length:', itemsArray.length);
        console.log('Items array (full):', JSON.stringify(itemsArray, null, 2));
        console.log('Items object keys:', Object.keys(items));

        // Log each item's structure
        itemsArray.forEach((item, index) => {
          console.log(`\nItem ${index}:`);
          console.log('  Raw item:', JSON.stringify(item));
          console.log('  item.qty:', item.qty);
          console.log('  item.quantity:', item.quantity);
          console.log('  All item keys:', Object.keys(item));
        });

        totalQuantity = itemsArray.reduce((sum, item) => {
          // Try multiple possible field names
          let qty = 0;

          if (item.qty !== undefined && item.qty !== null) {
            qty = Number(item.qty);
            console.log(`Using item.qty: ${item.qty} -> ${qty}`);
          } else if (item.quantity !== undefined && item.quantity !== null) {
            qty = Number(item.quantity);
            console.log(`Using item.quantity: ${item.quantity} -> ${qty}`);
          } else if (typeof item === 'number') {
            qty = Number(item);
            console.log(`Item is a number: ${item} -> ${qty}`);
          } else {
            console.warn('⚠️ Could not extract quantity from item:', JSON.stringify(item));
          }

          const newSum = sum + qty;
          console.log(`Running total: ${sum} + ${qty} = ${newSum}`);
          return newSum;
        }, 0);

        console.log('===== END QUANTITY CALCULATION =====');
      } else {
        console.log('WARNING: items is not valid:', items);
      }

      console.log('FINAL Calculated totalQuantity:', totalQuantity);
      console.log('Type of totalQuantity:', typeof totalQuantity);
      console.log('totalQuantity === 0:', totalQuantity === 0);
      console.log('Is NaN:', isNaN(totalQuantity));

      // Ensure totalQuantity is a valid number
      const finalTotalQuantity = Number(totalQuantity) || 0;
      console.log('finalTotalQuantity after Number():', finalTotalQuantity);

      // Add to sales approval history with all required fields
      const historyData = {
        requestId,
        approvedAt: Date.now(),
        items: items,
        requesterId: requestData.requestedBy || '',
        requesterName: requestData.requestedByName || 'Direct Representative',
        requesterRole: 'DirectRepresentative',
        requestType: 'direct_representative',
        priority: requestData.priority || 'normal',
        notes: requestData.notes || '',
        status: 'Approved',
        approvedBy: approverData.approvedBy || currentUser?.uid || '',
        approverName: approverData.approverName || '',
        approverRole: approverData.approverRole || '',
        totalQuantity: finalTotalQuantity,
        type: 'direct_rep_sale',
        isDispatched: false,
        isCompletedByFG: false,
        shopName: requestData.shopName || requestData.requestedByName || 'Direct Representative'
      };

      console.log('History data to be saved:', JSON.stringify(historyData, null, 2));
      console.log('historyData.totalQuantity specifically:', historyData.totalQuantity);

      // Save directly to salesApprovalHistory first, then update the request
      const historyRef = ref(database, 'salesApprovalHistory');
      const newHistoryRef = push(historyRef);

      // Set the history record directly instead of using multi-path update
      await update(newHistoryRef, historyData);

      // Apply updates to the request
      console.log('Applying updates to drreqs...');
      console.log('Number of update paths:', Object.keys(updates).length);
      console.log('Updates:', JSON.stringify(updates, null, 2));

      await update(ref(database), updates);

      console.log('✓ All updates applied successfully. History ID:', newHistoryRef.key);

      // Verify the data was saved correctly
      console.log('Verifying saved data...');
      const verifySnapshot = await get(ref(database, `salesApprovalHistory/${newHistoryRef.key}`));
      if (verifySnapshot.exists()) {
        const savedData = verifySnapshot.val();
        console.log('✓ Verified saved data in salesApprovalHistory:');
        console.log('  - totalQuantity:', savedData.totalQuantity);
        console.log('  - items:', JSON.stringify(savedData.items, null, 2));
        console.log('  - Full saved data:', JSON.stringify(savedData, null, 2));
      } else {
        console.error('✗ ERROR: Could not verify saved data - record not found!');
      }

      // Notify FG Store
      await this.notifyFGStoreOfApprovedRequest(newHistoryRef.key, historyData);

      return { success: true, historyId: newHistoryRef.key };
    } catch (error) {
      console.error('Error approving Direct Representative request:', error);
      throw new Error(`Failed to approve Direct Representative request: ${error.message}`);
    }
  },

  // Reject Direct Representative request
  async rejectRequest(requestId, rejectionData) {
    try {
      const currentUser = auth.currentUser;

      const updates = {
        [`/drreqs/${requestId}/status`]: 'Rejected',
        [`/drreqs/${requestId}/updatedAt`]: Date.now(),
        [`/drreqs/${requestId}/rejectedAt`]: Date.now(),
        [`/drreqs/${requestId}/rejectedBy`]: currentUser?.uid || '',
        [`/drreqs/${requestId}/rejectionReason`]: rejectionData.reason || 'Request rejected'
      };

      await update(ref(database), updates);
      return { success: true };
    } catch (error) {
      console.error('Error rejecting Direct Representative request:', error);
      throw new Error(`Failed to reject Direct Representative request: ${error.message}`);
    }
  },

  // Notify FG Store about approved requests
  async notifyFGStoreOfApprovedRequest(requestId, requestData) {
    try {
      const notification = {
        type: 'approved_sales_request',
        requestId,
        message: `New approved Direct Representative request ready for dispatch: ${requestData.requesterName}`,
        data: {
          requestType: 'approved_sales',
          requesterName: requestData.requesterName,
          requesterRole: 'DirectRepresentative',
          totalItems: Object.keys(requestData.items || {}).length,
          totalQuantity: requestData.totalQuantity || 0,
          priority: requestData.priority || 'normal'
        },
        status: 'unread',
        createdAt: Date.now()
      };

      // Get FG Store users
      const usersRef = ref(database, 'users');
      const usersSnapshot = await get(usersRef);
      if (usersSnapshot.exists()) {
        const users = usersSnapshot.val();
        const fgUsers = Object.entries(users)
          .filter(([_, user]) => user.role === 'FinishedGoodsStoreManager')
          .map(([uid, _]) => uid);

        for (const fgId of fgUsers) {
          const notificationRef = push(ref(database, `notifications/${fgId}`));
          await update(ref(database), {
            [`/notifications/${fgId}/${notificationRef.key}`]: notification
          });
        }
      }
    } catch (error) {
      console.error('Failed to notify FG store:', error);
    }
  }
};
