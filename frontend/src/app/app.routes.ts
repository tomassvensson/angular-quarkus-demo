import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page.component';
import { AdminUsersPageComponent } from './pages/admin-users-page.component';
import { UserEditPageComponent } from './pages/user-edit-page.component';
import { ProfilePageComponent } from './pages/profile-page.component';
import { MyListsComponent } from './pages/my-lists.component';
import { PublicListsComponent } from './pages/public-lists.component';
import { ListDetailComponent } from './pages/list-detail.component';

export const routes: Routes = [
	{ path: '', component: HomePageComponent },
	{ path: 'profile', component: ProfilePageComponent },
	{ path: 'users', component: AdminUsersPageComponent },
	{ path: 'users/:username', component: UserEditPageComponent },
    { path: 'my-lists', component: MyListsComponent },
    { path: 'public-lists', component: PublicListsComponent },
    { path: 'lists/:id', component: ListDetailComponent }
];

