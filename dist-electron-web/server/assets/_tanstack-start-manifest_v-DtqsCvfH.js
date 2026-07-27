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
			"/./assets/index-DWYPJJ8I.js",
			"/./assets/utils-CXOPvuNg.js",
			"/./assets/api-CJfXqH5S.js",
			"/./assets/dist-DaqZdc9D.js",
			"/./assets/input-hVXE91Mq.js",
			"/./assets/createLucideIcon-BMdC7VzF.js",
			"/./assets/link-CytdG7Y6.js",
			"/./assets/useRouter-Ds4HpEF9.js"
		],
		scripts: [{ attrs: {
			type: "module",
			async: !0,
			src: "/./assets/index-DWYPJJ8I.js"
		} }]
	},
	"/calculator": {
		filePath: "/dev-server/src/routes/calculator.tsx",
		children: void 0,
		preloads: [
			"/./assets/calculator-CbZPYryQ.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/car-CA2P4ebD.js",
			"/./assets/chevron-left-BqWSDjEr.js",
			"/./assets/chevron-right-BSPk6oOj.js",
			"/./assets/pencil-DSbZFWBc.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/printer-9FV0u7_R.js",
			"/./assets/search-C46IyKU3.js",
			"/./assets/PrintDocument-DQ2uMfl8.js",
			"/./assets/useCarCustomServices-Cno2jmCH.js",
			"/./assets/carsCatalogDb-CEX10qhi.js"
		]
	},
	"/calendar": {
		filePath: "/dev-server/src/routes/calendar.tsx",
		children: void 0,
		preloads: [
			"/./assets/calendar-Bh2mmSNd.js",
			"/./assets/useMutation-2rm6oxEF.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/badge-8GsVQTcK.js",
			"/./assets/AppointmentDialog-C8C1HUgv.js",
			"/./assets/trash-2-CVoWsJf7.js"
		]
	},
	"/clients": {
		filePath: "/dev-server/src/routes/clients.tsx",
		children: void 0,
		preloads: [
			"/./assets/clients-CgtrbmnH.js",
			"/./assets/dropdown-menu-DELojIHS.js",
			"/./assets/command-ClmQ3f00.js",
			"/./assets/useMutation-2rm6oxEF.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/arrow-left-BiGc-5A0.js",
			"/./assets/car-CA2P4ebD.js",
			"/./assets/pencil-DSbZFWBc.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/search-C46IyKU3.js",
			"/./assets/ModificationForm-DFpyACx8.js",
			"/./assets/carsCatalogDb-CEX10qhi.js"
		]
	},
	"/expenses": {
		filePath: "/dev-server/src/routes/expenses.tsx",
		children: void 0,
		preloads: [
			"/./assets/expenses-CGoqsUH_.js",
			"/./assets/tabs-C4jaLpPV.js",
			"/./assets/useMutation-2rm6oxEF.js",
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
		preloads: ["/./assets/login-D62kHJ1A.js", "/./assets/useLoginHero-CG871O3t.js"]
	},
	"/mechanics": {
		filePath: "/dev-server/src/routes/mechanics.tsx",
		children: void 0,
		preloads: [
			"/./assets/mechanics-DpJAp_ac.js",
			"/./assets/useMutation-2rm6oxEF.js",
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
			"/./assets/schedule-B69jd5uB.js",
			"/./assets/dropdown-menu-DELojIHS.js",
			"/./assets/useMutation-2rm6oxEF.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/badge-8GsVQTcK.js",
			"/./assets/parseISO-BiH2Q19P.js",
			"/./assets/AppointmentDialog-C8C1HUgv.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/printer-9FV0u7_R.js",
			"/./assets/PrintDocument-DQ2uMfl8.js"
		]
	},
	"/settings": {
		filePath: "/dev-server/src/routes/settings.tsx",
		children: void 0,
		preloads: [
			"/./assets/settings-BaxB1_t7.js",
			"/./assets/tabs-C4jaLpPV.js",
			"/./assets/useMutation-2rm6oxEF.js",
			"/./assets/useQuery-BhntOjjW.js",
			"/./assets/car-CA2P4ebD.js",
			"/./assets/pencil-DSbZFWBc.js",
			"/./assets/trash-2-CVoWsJf7.js",
			"/./assets/useLoginHero-CG871O3t.js",
			"/./assets/ModificationForm-DFpyACx8.js",
			"/./assets/carsCatalogDb-CEX10qhi.js"
		]
	},
	"/stats": {
		filePath: "/dev-server/src/routes/stats.tsx",
		children: void 0,
		preloads: [
			"/./assets/stats-DZM3PXqM.js",
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
