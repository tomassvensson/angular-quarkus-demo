import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page.component';
import { AdminUsersPageComponent } from './pages/admin-users-page.component';
import { UserEditPageComponent } from './pages/user-edit-page.component';

export const routes: Routes = [
	{ path: '', component: HomePageComponent },
	{ path: 'users', component: AdminUsersPageComponent },
	{ path: 'users/:username', component: UserEditPageComponent }
];
