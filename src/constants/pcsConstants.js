export const PCS_PAGES = {
  DASHBOARD: '/admin/pcs/dashboard',
  USER_MATRIX: '/admin/pcs/user-matrix',
  PERMISSION_CONTROL: '/admin/pcs/control',
  SALES_APPROVAL_HISTORY: '/admin/pcs/sales-history',
  DIRECT_SHOWROOMS: '/admin/direct-showrooms'
};

export const PCS_PAGE_TITLES = {
  [PCS_PAGES.DASHBOARD]: 'PCS Dashboard',
  [PCS_PAGES.USER_MATRIX]: 'User Permission Matrix',
  [PCS_PAGES.PERMISSION_CONTROL]: 'Permission Control',
  [PCS_PAGES.SALES_APPROVAL_HISTORY]: 'Sales Approval History',
  [PCS_PAGES.DIRECT_SHOWROOMS]: 'Direct Showrooms'
};

export const DEFAULT_PERMISSIONS = {
  'MainDirector': {
    [PCS_PAGES.DASHBOARD]: true,
    [PCS_PAGES.USER_MATRIX]: true,
    [PCS_PAGES.PERMISSION_CONTROL]: true,
    [PCS_PAGES.SALES_APPROVAL_HISTORY]: true,
    [PCS_PAGES.DIRECT_SHOWROOMS]: true
  },
  'HeadOfOperations': {
    [PCS_PAGES.SALES_APPROVAL_HISTORY]: true
  }
};