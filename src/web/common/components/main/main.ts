/*
 Copyright (C) 2017 3NSoft Inc.

 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

 You should have received a copy of the GNU General Public License along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

import * as CONST from '../../services/const';
import * as CacheSrvMod from '../../services/cache-srv';

export let ModuleName = '3nClient.components.main';

export function addComponent(angular: angular.IAngularStatic): void {
  let mod = angular.module(ModuleName, []);
  mod.component('main', componentConfig);
}

class Controller {
	private sideNav: {
		content: string;
    isOpen: boolean;
    isLocked: boolean;
    isShow: boolean;
	};

	static $inject = ['$scope', '$state', '$stateParams', '$location', '$timeout', '$mdSidenav', CacheSrvMod.CacheSrvName];
	constructor(
		private $scope: angular.IScope,
		private $state: angular.ui.IStateService,
		private $stateParams: angular.ui.IStateParamsService,
		private $location: angular.ILocationService,
		private $timeout: angular.ITimeoutService,
		private $mdSidenav: angular.material.ISidenavService,
		private _cacheSrv: CacheSrvMod.Cache
	) {

		this.init();

		this.$scope.$on('client_toCloseSidenav', () => {
			this.closeSidenav();
		});

		this.$scope.$on('$destroy', () => {
		})

	}

	private init(): void {
		this.sideNav = {
			content: '',
	    isOpen: false,
	    isLocked: false,
	    isShow: false
		};
		const currentState = (this.$location.url() === '/') ? 'storage' : this.$location.url().split('/')[1];
		// console.log(`Main init (state): ${currentState}`)
		this.goApp(currentState);
	}

	private goApp(state: string): void {
		// console.log(`State (in goApp foo): ${state}`)
		let blockTransition = false;
		switch (state) {
			case 'chat':
				blockTransition = (this.$state.current.name === 'root.chat') ? true : false;
				break;
			case 'storage':
				blockTransition = (this.$state.current.name === 'root.storage') ? true : false;
				break;
			case 'mail':
				blockTransition = (this.$state.current.name === 'root.mail') || (this.$state.current.name === 'root.mail.folder') ? true : false
				break;
			case 'contacts':
				blockTransition = (this.$state.current.name === 'root.contacts') || (this.$state.current.name === 'root.groups') ? true : false
				break;
		}

		if (!blockTransition) {

			const goStateName = CONST.APPS[state].stateName;
			this._cacheSrv.general.appSelected = CONST.APPS[state].app;

			if (this.sideNav.isOpen) {
				this.closeSidenav();
			}

			switch (state) {
				case 'mail':
					// this.$state.go(goStateName, { folderId: this._cacheSrv.folders.selectId, msgMode: 'hide' });
					//this.$state.go(goStateName);
					break;
				case 'contacts':
					// this._cacheSrv.contacts.cMode = 'hide';
					break;
				case 'groups':
					// this._cacheSrv.groups.grMode = 'hide';
					break;
			}

			this.$state.go(goStateName);
		} else {
			this._cacheSrv.general.appSelected = CONST.APPS[state].app;
		}
	}

	private openSidenav(): void {
		this.sideNav.isShow = true;
		this.sideNav.isOpen = true;
		this.$timeout(() => {
			this.$scope.$broadcast('client_sidenavIsOpened');
		}, CONST.SYS_APP_UI.sidenavAnimationTime);
	}

	private closeSidenav(): void {
		this.sideNav.isOpen = false;
		this.$timeout(() => {
			this.$scope.$broadcast('client_sidenavIsClosed');
		}, CONST.SYS_APP_UI.sidenavAnimationTime);
	}

	private toggleSideNav(content: string): void {
    this.sideNav.content = content;
    if (this.sideNav.isOpen) {
      this.closeSidenav();
    } else {
      this.openSidenav();
    }
	}

}

const componentConfig: angular.IComponentOptions = {
	bindings: {},
	templateUrl: './templates/common/components/main/main.html',
	controller: Controller
};
