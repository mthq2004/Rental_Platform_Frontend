import AccountManagementPage from "../../components/account/AccountManagementPage";

const AdminListPage = () => {
  return <AccountManagementPage role="admin" title="Quản lý tài khoản quản trị viên" detailBasePath="/dashboard/admins" />;
};

export default AdminListPage;
