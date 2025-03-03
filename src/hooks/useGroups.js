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
            console.log('Current user ID:', user.id);

            if (!user) throw new Error('No user logged in');

            // Fetch groups where user is a member
            const { data, error } = await supabase
                .from('group_members')
                .select(`
                    group:group_id (
                        id,
                        name,
                        created_by,
                        created_at,
                        members:group_members(
                            user:user_id(
                                id,
                                full_name,
                                email
                            )
                        )
                    )
                `)
                .eq('user_id', user.id);

            if (error) throw error;

            // Transform the data structure
            const transformedGroups = data.map(({ group }) => ({
                id: group.id,
                name: group.name,
                isOwner: group.created_by === user.id,
                members: group.members.map(member => member.user),
                created_at: group.created_at
            }));

            console.log('Fetched groups:', transformedGroups);
            setGroups(transformedGroups);
        } catch (err) {
            console.error('Error in fetchGroups:', err);
            setError(err.message);
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
            const { error } = await supabase
                .from('groups')
                .delete()
                .eq('id', groupId);

            if (error) throw error;

            await fetchGroups();
        } catch (err) {
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