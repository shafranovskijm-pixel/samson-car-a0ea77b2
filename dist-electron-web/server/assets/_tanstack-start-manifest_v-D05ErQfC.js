//#region \0tanstack-start-manifest:v
var tsrStartManifest = () => ({ routes: {
	__root__: {
		filePath: "/dev-server/src/routes/__root.tsx",
		children: [
			"/",
			"/calculator",
			"/calendar",
			"/clients",
			"/expenses",
			"/login",
			"/mechanics",
			"/schedule",
			"/settings",
			"/stats"
		],
		css: ["/./assets/index-BmGKuEuj.css"],
		preloads: [
			"/./assets/index-DOjhfeAz.js",
			"/./assets/utils-CXOPvuNg.js",
			"/./assets/api-H9Th6sEP.js",
			"/./assets/dist-U65BaAAg.js",
			"/./assets/input-hVXE91Mq.js",
			"/./assets/createLucideIcon-BMdC7VzF.js",
			"/./assets/link-CytdG7Y6.js",
			"/./assets/useRouter-Ds4HpEF9.js"
		],
		scripts: [{ attrs: {
			type: "module",
			async: !0,
			src: "/./assets/index-DOjhfeAz.js"
		} }]
	},
	"/calculator": {
		filePath: "/dev-server/src/routes/calculator.tsx",
		children: void 0,
		preloads: [
			"/./assets/calculator-DzisPzWE.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/car-CA2P4ebD.js",
			"/./assets/chevron-left-BqWSDjEr.js",
			"/./assets/chevron-right-BSPk6oOj.js",
			"/./assets/pencil-DSbZFWBc.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/printer-9FV0u7_R.js",
			"/./assets/search-C46IyKU3.js",
			"/./assets/PrintDocument-DQ2uMfl8.js",
			"/./assets/useCarCustomServices-BEkErB8T.js",
			"/./assets/carsCatalogDb-XzFgn_lu.js"
		]
	},
	"/calendar": {
		filePath: "/dev-server/src/routes/calendar.tsx",
		children: void 0,
		preloads: [
			"/./assets/calendar-DlgmhUgP.js",
			"/./assets/useMutation-wOt5jKAJ.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/badge-8GsVQTcK.js",
			"/./assets/AppointmentDialog-BOE-YlKL.js",
			"/./assets/trash-2-CVoWsJf7.js"
		]
	},
	"/clients": {
		filePath: "/dev-server/src/routes/clients.tsx",
		children: void 0,
		preloads: [
			"/./assets/clients-DKYgIYtU.js",
			"/./assets/dropdown-menu-DtYM3Av4.js",
			"/./assets/command-BU54p9hC.js",
			"/./assets/useMutation-wOt5jKAJ.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/arrow-left-BiGc-5A0.js",
			"/./assets/car-CA2P4ebD.js",
			"/./assets/pencil-DSbZFWBc.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/search-C46IyKU3.js",
			"/./assets/ModificationForm-C8XLYSm_.js",
			"/./assets/carsCatalogDb-XzFgn_lu.js"
		]
	},
	"/expenses": {
		filePath: "/dev-server/src/routes/expenses.tsx",
		children: void 0,
		preloads: [
			"/./assets/expenses-CmzaoNk4.js",
			"/./assets/tabs-HYbxzYB_.js",
			"/./assets/useMutation-wOt5jKAJ.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/badge-8GsVQTcK.js",
			"/./assets/parseISO-BiH2Q19P.js",
			"/./assets/chevron-left-BqWSDjEr.js",
			"/./assets/chevron-right-BSPk6oOj.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/printer-9FV0u7_R.js",
			"/./assets/payouts-DQMcinMS.js"
		]
	},
	"/login": {
		filePath: "/dev-server/src/routes/login.tsx",
		children: void 0,
		preloads: ["/./assets/login-B8YiD0mk.js", "/./assets/useLoginHero-CG871O3t.js"]
	},
	"/mechanics": {
		filePath: "/dev-server/src/routes/mechanics.tsx",
		children: void 0,
		preloads: [
			"/./assets/mechanics-CluNQhgz.js",
			"/./assets/useMutation-wOt5jKAJ.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/arrow-left-BiGc-5A0.js",
			"/./assets/calendar-clock-3gWW6lDW.js",
			"/./assets/chevron-right-BSPk6oOj.js",
			"/./assets/pencil-DSbZFWBc.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/payouts-DQMcinMS.js"
		]
	},
	"/schedule": {
		filePath: "/dev-server/src/routes/schedule.tsx",
		children: void 0,
		preloads: [
			"/./assets/schedule-iByBH5C-.js",
			"/./assets/dropdown-menu-DtYM3Av4.js",
			"/./assets/useMutation-wOt5jKAJ.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/badge-8GsVQTcK.js",
			"/./assets/parseISO-BiH2Q19P.js",
			"/./assets/AppointmentDialog-BOE-YlKL.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/printer-9FV0u7_R.js",
			"/./assets/PrintDocument-DQ2uMfl8.js"
		]
	},
	"/settings": {
		filePath: "/dev-server/src/routes/settings.tsx",
		children: void 0,
		preloads: [
			"/./assets/settings-CmUZFs0i.js",
			"/./assets/tabs-HYbxzYB_.js",
			"/./assets/useMutation-wOt5jKAJ.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/car-CA2P4ebD.js",
			"/./assets/pencil-DSbZFWBc.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/useLoginHero-CG871O3t.js",
			"/./assets/ModificationForm-C8XLYSm_.js",
			"/./assets/carsCatalogDb-XzFgn_lu.js"
		]
	},
	"/stats": {
		filePath: "/dev-server/src/routes/stats.tsx",
		children: void 0,
		preloads: [
			"/./assets/stats-D1t3KJHw.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/badge-8GsVQTcK.js",
			"/./assets/parseISO-BiH2Q19P.js",
			"/./assets/car-CA2P4ebD.js",
			"/./assets/wrench-CCCfFqER.js"
		]
	}
} });
//#endregion
export { tsrStartManifest };
