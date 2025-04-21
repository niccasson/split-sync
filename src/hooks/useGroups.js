import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export const useGroups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('No user logged in');

            // 1. Get the user's group memberships
            const [registeredMemberships, manualFriendsResult] = await Promise.all([
                // Get groups where user is registered member
                supabase
                    .from('group_members')
                    .select('group_id')
                    .eq('registered_user_id', user.id),

                // First get user's manual friends
                supabase
                    .from('manual_friends')
                    .select('id')
                    .eq('user_id', user.id)
            ]);

            if (registeredMemberships.error) throw registeredMemberships.error;
            if (manualFriendsResult.error) throw manualFriendsResult.error;

            // Then get groups containing these manual friends
            const manualMemberships = manualFriendsResult.data.length > 0
                ? await supabase
                    .from('group_members')
                    .select('group_id')
                    .in('manual_friend_id', manualFriendsResult.data.map(f => f.id))
                : { data: [] };

            if (manualMemberships.error) throw manualMemberships.error;

            // Combine and deduplicate group IDs
            const allGroupIds = [...new Set([
                ...(registeredMemberships.data || []).map(m => m.group_id),
                ...(manualMemberships.data || []).map(m => m.group_id)
            ])];

            if (allGroupIds.length === 0) {
                setGroups([]);
                return;
            }

            // 2. Get the group details
            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select('id, name, created_by')
                .in('id', allGroupIds);

            if (groupsError) throw groupsError;

            // 3. Get all members for these groups, including manual friends
            const { data: allMembers, error: membersError } = await supabase
                .from('group_members')
                .select(`
                    group_id,
                    registered_user_id,
                    manual_friend_id,
                    is_manual_friend
                `)
                .in('group_id', allGroupIds);

            if (membersError) throw membersError;

            // 4. Separate registered users and manual friends
            const registeredUserIds = allMembers
                .filter(m => !m.is_manual_friend)
                .map(m => m.registered_user_id)
                .filter(id => id);

            const manualFriendIds = allMembers
                .filter(m => m.is_manual_friend)
                .map(m => m.manual_friend_id)
                .filter(id => id);

            // 5. Fetch registered users' details
            const { data: registeredUsers, error: regUsersError } = registeredUserIds.length > 0
                ? await supabase
                    .from('users')
                    .select('id, email, full_name')
                    .in('id', registeredUserIds)
                : { data: [], error: null };

            if (regUsersError) throw regUsersError;

            // 6. Fetch manual friends' details
            const { data: manualFriends, error: manualError } = manualFriendIds.length > 0
                ? await supabase
                    .from('manual_friends')
                    .select('id, name')
                    .in('id', manualFriendIds)
                : { data: [], error: null };

            if (manualError) throw manualError;

            // 7. Transform the data
            const transformedGroups = groupsData.map(group => {
                const groupMembers = allMembers
                    .filter(m => m.group_id === group.id)
                    .map(m => {
                        if (m.is_manual_friend) {
                            const manualFriend = manualFriends.find(f => f.id === m.manual_friend_id);
                            return {
                                id: manualFriend?.id,
                                full_name: manualFriend?.name,
                                email: null,
                                isManualFriend: true
                            };
                        } else {
                            const regUser = registeredUsers.find(u => u.id === m.registered_user_id);
                            return {
                                id: regUser?.id,
                                email: regUser?.email,
                                full_name: regUser?.full_name,
                                isManualFriend: false
                            };
                        }
                    })
                    .filter(m => m.id); // Remove any undefined members

                return {
                    id: group.id,
                    name: group.name,
                    isOwner: group.created_by === user.id,
                    members: groupMembers
                };
            });

            setGroups(transformedGroups);
        } catch (err) {
            console.error('Error in fetchGroups:', err);
            setError(err.message);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    const createGroup = async (name, members) => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            // First create the group
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .insert([{
                    name,
                    created_by: user.id
                }])
                .select()
                .single();

            if (groupError) throw groupError;

            // Add creator as a member first
            const { error: creatorError } = await supabase
                .from('group_members')
                .insert([{
                    group_id: groupData.id,
                    registered_user_id: user.id,
                    manual_friend_id: null,
                    is_manual_friend: false
                }]);

            if (creatorError) {
                throw creatorError;
            }

            // Process each member
            for (const member of members) {
                try {
                    if (member.isRegistered) {
                        // Add registered user
                        const { error: memberError } = await supabase
                            .from('group_members')
                            .insert([{
                                group_id: groupData.id,
                                registered_user_id: member.id,
                                manual_friend_id: null,
                                is_manual_friend: false
                            }]);

                        if (memberError) {
                        }
                    } else {
                        // For manual friends, first ensure they exist in manual_friends table
                        const { data: existingFriend, error: checkError } = await supabase
                            .from('manual_friends')
                            .select('id')
                            .eq('name', member.full_name)
                            .eq('user_id', user.id)
                            .single();

                        if (checkError || !existingFriend) {
                            // Create new manual friend if doesn't exist
                            const { data: newFriend, error: createError } = await supabase
                                .from('manual_friends')
                                .insert([{
                                    user_id: user.id,
                                    name: member.full_name
                                }])
                                .select()
                                .single();

                            if (createError) {
                                continue;
                            }

                            member.id = newFriend.id;
                        } else {
                            member.id = existingFriend.id;
                        }

                        // Now add the manual friend to the group
                        const { error: memberError } = await supabase
                            .from('group_members')
                            .insert([{
                                group_id: groupData.id,
                                registered_user_id: null,
                                manual_friend_id: member.id,
                                is_manual_friend: true
                            }]);

                        if (memberError) {
                        }
                    }
                } catch (memberErr) {
                }
            }

            await fetchGroups();
        } catch (err) {
            console.error('Error in createGroup:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const addMember = async (groupId, email) => {
        try {
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (userError) throw new Error('User not found');

            const { error } = await supabase
                .from('group_members')
                .insert([{
                    group_id: groupId,
                    registered_user_id: user.id,
                    manual_friend_id: null,
                    is_manual_friend: false
                }]);

            if (error) throw error;

            await fetchGroups();
        } catch (err) {
            throw err;
        }
    };

    const removeMember = async (groupId, userId) => {
        try {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('registered_user_id', userId);

            if (error) throw error;

            await fetchGroups();
        } catch (err) {
            throw err;
        }
    };

    const deleteGroup = async (groupId) => {
        try {
            // First delete all expenses in the group
            const { data: expenseData, error: expenseError } = await supabase
                .from('expenses')
                .delete()
                .eq('group_id', groupId)
                .select();

            if (expenseError) {
                throw expenseError;
            }

            // Then delete the group
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .delete()
                .eq('id', groupId)
                .select();

            if (groupError) {
                throw groupError;
            }

            await fetchGroups();
        } catch (err) {
            console.error('Error in deleteGroup:', err);
            throw err;
        }
    };

    const refreshGroups = async () => {
        try {
            setLoading(true);
            setError(null);
            console.time('fetchGroups');

            const { data: { user } } = await supabase.auth.getUser();
            console.timeLog('fetchGroups', 'Got user');

            // Fetch groups where user is owner
            const { data: ownedGroups, error: ownedError } = await supabase
                .from('groups')
                .select(`
                    id,
                    name,
                    owner_id,
                    members:group_members(
                        id,
                        user:user_id(id, email, full_name),
                        manual_friend:manual_friend_id(id, name),
                        is_manual_friend
                    )
                `)
                .eq('owner_id', user.id);
            console.timeLog('fetchGroups', 'Got owned groups');

            // Fetch groups where user is a member
            const { data: memberGroups, error: memberError } = await supabase
                .from('group_members')
                .select(`
                    group:group_id(
                        id,
                        name,
                        owner_id,
                        members:group_members(
                            id,
                            user:user_id(id, email, full_name),
                            manual_friend:manual_friend_id(id, name),
                            is_manual_friend
                        )
                    )
                `)
                .eq('user_id', user.id);
            console.timeLog('fetchGroups', 'Got member groups');

            if (ownedError) throw ownedError;
            if (memberError) throw memberError;

            const processedGroups = processGroups(ownedGroups, memberGroups, user.id);
            console.timeEnd('fetchGroups');

            setGroups(processedGroups);
        } catch (error) {
            console.error('Error in refreshGroups:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        let timeoutId;

        const loadGroups = async () => {
            try {
                if (!mounted) return;
                await fetchGroups();
            } catch (error) {
                console.error('Error loading groups:', error);
            }
        };

        // Debounced refresh function
        const debouncedRefresh = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(loadGroups, 300);
        };

        // Single subscription for all relevant tables
        const subscription = supabase
            .channel('groups-channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'groups'
            }, debouncedRefresh)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'group_members'
            }, debouncedRefresh)
            .subscribe();

        // Initial load
        loadGroups();

        return () => {
            mounted = false;
            if (timeoutId) clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    return {
        groups,
        loading,
        error,
        createGroup,
        addMember,
        removeMember,
        deleteGroup,
        refreshGroups: fetchGroups
    };
}; 