import AccountManagementPage from "../../components/account/AccountManagementPage";

const UserListPage = () => {
  return <AccountManagementPage role="user" title="Quản lý tài khoản người dùng" detailBasePath="/dashboard/users" />;
};

export default UserListPage;
