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
            console.log('Fetching groups for user:', user.id);

            if (!user) throw new Error('No user logged in');

            // 1. First get the user's group memberships
            const { data: memberships, error: membershipError } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id);

            if (membershipError) throw membershipError;

            if (!memberships || memberships.length === 0) {
                console.log('No group memberships found');
                setGroups([]);
                return;
            }

            // 2. Then get the group details
            const groupIds = memberships.map(m => m.group_id);
            const { data: groupsData, error: groupsError } = await supabase
                .from('groups')
                .select('id, name, created_by')
                .in('id', groupIds);

            if (groupsError) throw groupsError;

            // 3. Finally get all members for these groups
            const { data: allMembers, error: membersError } = await supabase
                .from('group_members')
                .select(`
                    group_id,
                    user:user_id (
                        id,
                        email,
                        full_name
                    )
                `)
                .in('group_id', groupIds);

            if (membersError) throw membersError;

            // Transform the data
            const transformedGroups = groupsData.map(group => {
                const groupMembers = allMembers
                    .filter(m => m.group_id === group.id && m.user)
                    .map(m => ({
                        id: m.user.id,
                        email: m.user.email,
                        full_name: m.user.full_name
                    }));

                return {
                    id: group.id,
                    name: group.name,
                    isOwner: group.created_by === user.id,
                    members: groupMembers
                };
            });

            console.log('Final transformed groups:', transformedGroups);
            setGroups(transformedGroups);
        } catch (err) {
            console.error('Error in fetchGroups:', err);
            setError(err.message);
            setGroups([]);
        } finally {
            setLoading(false);
        }
    };

    const createGroup = async (name, memberEmails) => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('No user logged in');

            // Create the group
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .insert([
                    {
                        name,
                        created_by: user.id
                    }
                ])
                .select()
                .single();

            if (groupError) throw groupError;

            // Add creator as a member
            const { error: creatorError } = await supabase
                .from('group_members')
                .insert([
                    {
                        group_id: groupData.id,
                        user_id: user.id
                    }
                ]);

            if (creatorError) throw creatorError;

            // Find and add other members
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('id')
                .in('email', memberEmails);

            if (usersError) throw usersError;

            if (users.length > 0) {
                const memberInserts = users.map(user => ({
                    group_id: groupData.id,
                    user_id: user.id
                }));

                const { error: membersError } = await supabase
                    .from('group_members')
                    .insert(memberInserts);

                if (membersError) throw membersError;
            }

            await fetchGroups();
        } catch (err) {
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
                .insert([
                    {
                        group_id: groupId,
                        user_id: user.id
                    }
                ]);

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
                .eq('user_id', userId);

            if (error) throw error;

            await fetchGroups();
        } catch (err) {
            throw err;
        }
    };

    const deleteGroup = async (groupId) => {
        try {
            console.log('Starting delete operation for group:', groupId);

            // Delete the group (members will be deleted automatically via CASCADE)
            const { error } = await supabase
                .from('groups')
                .delete()
                .eq('id', groupId);

            if (error) {
                console.error('Error deleting group:', error);
                throw error;
            }

            await fetchGroups();
        } catch (err) {
            console.error('Error in deleteGroup:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchGroups();
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