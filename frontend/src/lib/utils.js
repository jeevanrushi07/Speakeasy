export const capitialize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const handleAvatarError = (event, name = "Speakeasy") => {
	event.currentTarget.onerror = null;
	event.currentTarget.src = `https://api.dicebear.com/9.x/initials/png?seed=${encodeURIComponent(name)}`;
};
