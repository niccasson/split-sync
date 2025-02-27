import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export const useFriends = () => {
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFriends = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            console.log('Current user ID:', user.id);

            // First, let's see all friendships in the table
            const { data: allFriendships, error: allFriendshipsError } = await supabase
                .from('friendships')
                .select('*');

            console.log('All friendships in table:', allFriendships);

            if (!user) throw new Error('No user logged in');

            // Fetch friends with their details and balances
            const { data, error } = await supabase
                .from('friendships')
                .select(`
                    id,
                    friend:friend_id(
                        id,
                        email,
                        full_name
                    ),
                    status
                `)
                .eq('user_id', user.id)
                .eq('status', 'accepted');

            console.log('Fetched friendships for current user:', {
                userId: user.id,
                friendships: data
            });

            if (error) {
                console.error('Error fetching friendships:', error);
                throw error;
            }

            // Guard against null or undefined data
            if (!data || data.length === 0) {
                console.log('No friendships found');
                setFriends([]);
                return;
            }

            // Calculate balances for each friend
            const friendsWithBalances = await Promise.all(
                data.filter(friendship => friendship.friend) // Filter out any null friends
                    .map(async (friendship) => {
                        console.log('Processing friendship:', friendship);

                        try {
                            // Get money owed to user by friend
                            const { data: owedToUser } = await supabase
                                .from('expense_shares')
                                .select('amount')
                                .eq('user_id', friendship.friend.id)
                                .in('expense_id',
                                    supabase
                                        .from('expenses')
                                        .select('id')
                                        .eq('created_by', user.id)
                                ) || { data: [] };

                            // Get money user owes to friend
                            const { data: userOwes } = await supabase
                                .from('expense_shares')
                                .select('amount')
                                .eq('user_id', user.id)
                                .in('expense_id',
                                    supabase
                                        .from('expenses')
                                        .select('id')
                                        .eq('created_by', friendship.friend.id)
                                ) || { data: [] };

                            // Default to empty arrays if no data
                            const owedArray = Array.isArray(owedToUser) ? owedToUser : [];
                            const owesArray = Array.isArray(userOwes) ? userOwes : [];

                            const totalOwed = owedArray.reduce((sum, share) => sum + (Number(share?.amount) || 0), 0);
                            const totalOwes = owesArray.reduce((sum, share) => sum + (Number(share?.amount) || 0), 0);
                            const netBalance = totalOwed - totalOwes;

                            return {
                                id: friendship.friend.id,
                                name: friendship.friend.full_name,
                                email: friendship.friend.email,
                                balance: netBalance
                            };
                        } catch (err) {
                            console.error('Error processing friendship balances:', err);
                            // Return friend with zero balance if there's an error
                            return {
                                id: friendship.friend.id,
                                name: friendship.friend.full_name,
                                email: friendship.friend.email,
                                balance: 0
                            };
                        }
                    })
            );

            console.log('Final friends with balances:', friendsWithBalances);
            setFriends(friendsWithBalances);
        } catch (err) {
            console.error('Error in fetchFriends:', err);
            setError(err.message);
            setFriends([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const addFriend = async (email) => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            console.log('Current user:', user);

            if (!user) throw new Error('No user logged in');

            // Find user by email
            const { data: friendData, error: friendError } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            console.log('Found friend:', friendData);
            if (friendError) {
                console.error('Error finding friend:', friendError);
                throw new Error('User not found');
            }

            // Check if friendship already exists
            const { data: existingFriendship, error: existingError } = await supabase
                .from('friendships')
                .select('id')
                .eq('user_id', user.id)
                .eq('friend_id', friendData.id)
                .single();

            console.log('Existing friendship:', existingFriendship);
            if (existingError) console.log('Existing friendship error:', existingError);

            if (existingFriendship) {
                throw new Error('Already friends with this user');
            }

            // Create friendship
            const { data: newFriendship, error: friendshipError } = await supabase
                .from('friendships')
                .insert([
                    {
                        user_id: user.id,
                        friend_id: friendData.id,
                        status: 'accepted' // For simplicity, auto-accepting friendships
                    }
                ])
                .select();

            console.log('New friendship created:', newFriendship);
            if (friendshipError) {
                console.error('Error creating friendship:', friendshipError);
                throw friendshipError;
            }

            // Refresh friends list
            console.log('Refreshing friends list...');
            await fetchFriends();
        } catch (err) {
            console.error('Error in addFriend:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('Initial friends fetch...');
        fetchFriends();
    }, []);

    return {
        friends,
        loading,
        error,
        addFriend,
        refreshFriends: fetchFriends
    };
}; 