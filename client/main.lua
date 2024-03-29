menu_default 						  = {}
menu_default.UI						  = {}
menu_default.UI.Menu                   = {}
menu_default.UI.Menu.RegisteredTypes   = {}
menu_default.UI.Menu.Opened            = {}
menu_default.UI.Menu.RegisterType = function(type, open, close)
	menu_default.UI.Menu.RegisteredTypes[type] = {
		open   = open,
		close  = close
	}
end

menu_default.UI.Menu.Open = function(type, namespace, name, data, submit, cancel, change, close)
	local menu = {}
	menu.type      = type
	menu.namespace = namespace
	menu.name      = name
	menu.data      = data
	menu.submit    = submit
	menu.cancel    = cancel
	menu.change    = change

	menu.close = function()

		menu_default.UI.Menu.RegisteredTypes[type].close(namespace, name)

		for i=1, #menu_default.UI.Menu.Opened, 1 do
			if menu_default.UI.Menu.Opened[i] then
				if menu_default.UI.Menu.Opened[i].type == type and menu_default.UI.Menu.Opened[i].namespace == namespace and menu_default.UI.Menu.Opened[i].name == name then
					menu_default.UI.Menu.Opened[i] = nil
				end
			end
		end

		if close then
			close()
		end

	end

	menu.update = function(query, newData)

		for i=1, #menu.data.elements, 1 do
			local match = true

			for k,v in pairs(query) do
				if menu.data.elements[i][k] ~= v then
					match = false
				end
			end

			if match then
				for k,v in pairs(newData) do
					menu.data.elements[i][k] = v
				end
			end
		end

	end

	menu.refresh = function()
		menu_default.UI.Menu.RegisteredTypes[type].open(namespace, name, menu.data)
	end

	menu.setElement = function(i, key, val)
		menu.data.elements[i][key] = val
	end

	menu.setElements = function(newElements)
		menu.data.elements = newElements
	end

	menu.setTitle = function(val)
		menu.data.title = val
	end

	menu.removeElement = function(query)
		for i=1, #menu.data.elements, 1 do
			for k,v in pairs(query) do
				if menu.data.elements[i] then
					if menu.data.elements[i][k] == v then
						table.remove(menu.data.elements, i)
						break
					end
				end

			end
		end
	end

	table.insert(menu_default.UI.Menu.Opened, menu)
	menu_default.UI.Menu.RegisteredTypes[type].open(namespace, name, data)

	return menu
end

menu_default.UI.Menu.Close = function(type, namespace, name)
	for i=1, #menu_default.UI.Menu.Opened, 1 do
		if menu_default.UI.Menu.Opened[i] then
			if menu_default.UI.Menu.Opened[i].type == type and menu_default.UI.Menu.Opened[i].namespace == namespace and menu_default.UI.Menu.Opened[i].name == name then
				menu_default.UI.Menu.Opened[i].close()
				menu_default.UI.Menu.Opened[i] = nil
			end
		end
	end
end

menu_default.UI.Menu.CloseAll = function()
	for i=1, #menu_default.UI.Menu.Opened, 1 do
		if menu_default.UI.Menu.Opened[i] then
			menu_default.UI.Menu.Opened[i].close()
			menu_default.UI.Menu.Opened[i] = nil
		end
	end
end

menu_default.UI.Menu.GetOpened = function(type, namespace, name)
	for i=1, #menu_default.UI.Menu.Opened, 1 do
		if menu_default.UI.Menu.Opened[i] then
			if menu_default.UI.Menu.Opened[i].type == type and menu_default.UI.Menu.Opened[i].namespace == namespace and menu_default.UI.Menu.Opened[i].name == name then
				return menu_default.UI.Menu.Opened[i]
			end
		end
	end
end

menu_default.UI.Menu.GetOpenedMenus = function()
	return menu_default.UI.Menu.Opened
end

menu_default.UI.Menu.IsOpen = function(type, namespace, name)
	return menu_default.UI.Menu.GetOpened(type, namespace, name) ~= nil
end

Citizen.CreateThread(function()
	local GUI, MenuType = {}, 'default'
	GUI.Time = 0

	local openMenu = function(namespace, name, data)
		SendNUIMessage({
			action = 'openMenu',
			namespace = namespace,
			name = name,
			data = data
		})
	end

	local closeMenu = function(namespace, name)
		SendNUIMessage({
			action = 'closeMenu',
			namespace = namespace,
			name = name,
			data = data
		})
	end

	menu_default.UI.Menu.RegisterType(MenuType, openMenu, closeMenu)

	RegisterNUICallback('menu_submit', function(data, cb)
		local menu = menu_default.UI.Menu.GetOpened(MenuType, data._namespace, data._name)
		if menu.submit ~= nil then
			menu.submit(data, menu)
		end
		cb('OK')
	end)

	RegisterNUICallback('menu_cancel', function(data, cb)
		local menu = menu_default.UI.Menu.GetOpened(MenuType, data._namespace, data._name)

		if menu.cancel ~= nil then
			menu.cancel(data, menu)
		end
		cb('OK')
	end)

	RegisterNUICallback('menu_change', function(data, cb)
		local menu = menu_default.UI.Menu.GetOpened(MenuType, data._namespace, data._name)

		for i=1, #data.elements, 1 do
			menu.setElement(i, 'value', data.elements[i].value)

			if data.elements[i].selected then
				menu.setElement(i, 'selected', true)
			else
				menu.setElement(i, 'selected', false)
			end
		end

		if menu.change ~= nil then
			menu.change(data, menu)
		end
		cb('OK')
	end)

	Citizen.CreateThread(function()
		while true do
			Citizen.Wait(15)

			if IsControlPressed(0, 18) and IsInputDisabled(0) and (GetGameTimer() - GUI.Time) > 150 then
				SendNUIMessage({action = 'controlPressed', control = 'ENTER'})
				GUI.Time = GetGameTimer()
			end

			if IsControlPressed(0, 177) and IsInputDisabled(0) and (GetGameTimer() - GUI.Time) > 150 then
				SendNUIMessage({action  = 'controlPressed', control = 'BACKSPACE'})
				GUI.Time = GetGameTimer()
			end

			if IsControlPressed(0, 27) and IsInputDisabled(0) and (GetGameTimer() - GUI.Time) > 200 then
				SendNUIMessage({action  = 'controlPressed', control = 'TOP'})
				GUI.Time = GetGameTimer()
			end

			if IsControlPressed(0, 173) and IsInputDisabled(0) and (GetGameTimer() - GUI.Time) > 200 then
				SendNUIMessage({action  = 'controlPressed', control = 'DOWN'})
				GUI.Time = GetGameTimer()
			end

			if IsControlPressed(0, 174) and IsInputDisabled(0) and (GetGameTimer() - GUI.Time) > 150 then
				SendNUIMessage({action  = 'controlPressed', control = 'LEFT'})
				GUI.Time = GetGameTimer()
			end

			if IsControlPressed(0, 175) and IsInputDisabled(0) and (GetGameTimer() - GUI.Time) > 150 then
				SendNUIMessage({action  = 'controlPressed', control = 'RIGHT'})
				GUI.Time = GetGameTimer()
			end
		end
	end)
end)

exports('GetMenu', function()
    return menu_default
end)

function GetMenu()
	return menu_default
end