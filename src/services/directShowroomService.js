import { getData, setData, updateData, pushData } from '../firebase/db';
import { auth } from '../firebase/auth';

export const directShowroomService = {
  async getAllShowrooms() {
    try {
      const showrooms = await getData('direct_showrooms');
      if (!showrooms) return [];

      return Object.entries(showrooms).map(([id, showroom]) => ({
        id,
        ...showroom
      })).sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    } catch (error) {
      throw new Error(`Failed to fetch showrooms: ${error.message}`);
    }
  },

  async getActiveShowrooms() {
    try {
      const showrooms = await this.getAllShowrooms();
      return showrooms.filter(s => s.status === 'active');
    } catch (error) {
      throw new Error(`Failed to fetch active showrooms: ${error.message}`);
    }
  },

  async getShowroomById(id) {
    try {
      const showroom = await getData(`direct_showrooms/${id}`);
      if (!showroom) {
        throw new Error('Showroom not found');
      }
      return { id, ...showroom };
    } catch (error) {
      throw new Error(`Failed to fetch showroom: ${error.message}`);
    }
  },

  async getShowroomByCode(code) {
    try {
      const showrooms = await this.getAllShowrooms();
      return showrooms.find(s => s.code === code);
    } catch (error) {
      throw new Error(`Failed to fetch showroom by code: ${error.message}`);
    }
  },

  async createShowroom(showroomData) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      const existingShowroom = await this.getShowroomByCode(showroomData.code);
      if (existingShowroom) {
        throw new Error('Showroom code already exists');
      }

      const newShowroom = {
        name: showroomData.name,
        code: showroomData.code.toUpperCase(),
        location: showroomData.location,
        city: showroomData.city,
        contact_number: showroomData.contact_number || '',
        email: showroomData.email || '',
        manager_id: showroomData.manager_id || null,
        status: showroomData.status || 'active',
        opening_hours: showroomData.opening_hours || {
          monday: '9:00-18:00',
          tuesday: '9:00-18:00',
          wednesday: '9:00-18:00',
          thursday: '9:00-18:00',
          friday: '9:00-18:00',
          saturday: '9:00-18:00',
          sunday: 'closed'
        },
        target_sales: showroomData.target_sales || 0,
        metadata: showroomData.metadata || {},
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: currentUser.uid
      };

      const showroomId = await pushData('direct_showrooms', newShowroom);

      if (newShowroom.manager_id) {
        await updateData(`users/${newShowroom.manager_id}`, {
          showroom_id: showroomId,
          showroom_name: newShowroom.name,
          showroom_code: newShowroom.code
        });
      }

      return { id: showroomId, ...newShowroom };
    } catch (error) {
      throw new Error(`Failed to create showroom: ${error.message}`);
    }
  },

  async updateShowroom(id, updates) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      const existingShowroom = await this.getShowroomById(id);

      if (updates.code && updates.code !== existingShowroom.code) {
        const codeExists = await this.getShowroomByCode(updates.code);
        if (codeExists && codeExists.id !== id) {
          throw new Error('Showroom code already exists');
        }
      }

      const oldManagerId = existingShowroom.manager_id;
      const newManagerId = updates.manager_id;

      const updatedData = {
        ...updates,
        updated_at: Date.now()
      };

      await updateData(`direct_showrooms/${id}`, updatedData);

      if (oldManagerId && oldManagerId !== newManagerId) {
        await updateData(`users/${oldManagerId}`, {
          showroom_id: null,
          showroom_name: null,
          showroom_code: null
        });
      }

      if (newManagerId) {
        await updateData(`users/${newManagerId}`, {
          showroom_id: id,
          showroom_name: updates.name || existingShowroom.name,
          showroom_code: updates.code || existingShowroom.code
        });
      }

      return { id, ...existingShowroom, ...updatedData };
    } catch (error) {
      throw new Error(`Failed to update showroom: ${error.message}`);
    }
  },

  async deleteShowroom(id) {
    try {
      const showroom = await this.getShowroomById(id);

      if (showroom.manager_id) {
        await updateData(`users/${showroom.manager_id}`, {
          showroom_id: null,
          showroom_name: null,
          showroom_code: null
        });
      }

      await updateData(`direct_showrooms/${id}`, { status: 'inactive', updated_at: Date.now() });

      return true;
    } catch (error) {
      throw new Error(`Failed to delete showroom: ${error.message}`);
    }
  },

  async getShowroomStaff(showroomId) {
    try {
      const users = await getData('users');
      if (!users) return [];

      return Object.entries(users)
        .filter(([_, user]) => user.showroom_id === showroomId)
        .map(([uid, user]) => ({ uid, ...user }));
    } catch (error) {
      throw new Error(`Failed to fetch showroom staff: ${error.message}`);
    }
  },

  async assignManagerToShowroom(showroomId, managerId) {
    try {
      return await this.updateShowroom(showroomId, { manager_id: managerId });
    } catch (error) {
      throw new Error(`Failed to assign manager: ${error.message}`);
    }
  },

  async getShowroomStats(showroomId) {
    try {
      const showroom = await this.getShowroomById(showroomId);
      const staff = await this.getShowroomStaff(showroomId);

      return {
        showroom,
        totalStaff: staff.length,
        activeStaff: staff.filter(s => s.status === 'active').length,
        targetSales: showroom.target_sales || 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch showroom stats: ${error.message}`);
    }
  }
};
